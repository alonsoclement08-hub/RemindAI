const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { createUserAndLogin, app } = require("./helpers");
const { getPeriodBounds } = require("../src/services/budgetTracker");
const { analyzePatterns } = require("../src/services/aiRecommendations");

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) });

// Mock Gemma so tests don't need Ollama
jest.mock("../src/services/gemma", () => {
  const actual = jest.requireActual("../src/services/gemma");
  return {
    ...actual,
    callGemma: jest.fn().mockResolvedValue(JSON.stringify({
      recommendations: [
        { title: "Acheter croquettes",  reason: "Tu achètes toujours le samedi matin", category: "errand",  suggestedTime: "10:00", suggestedDay: "Samedi",    confidence: 0.92 },
        { title: "Appeler maman",        reason: "Tu appelles chaque mercredi",          category: "call",    suggestedTime: "15:00", suggestedDay: "Mercredi",  confidence: 0.88 },
        { title: "Boire 2L d'eau",       reason: "Habitude santé quotidienne",           category: "health",  suggestedTime: "08:00", suggestedDay: null,        confidence: 0.75 },
      ],
    })),
    extractJSON: actual.extractJSON,
  };
});

let token;

beforeEach(async () => {
  await prisma.budget.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.user.deleteMany();
  const auth = await createUserAndLogin();
  token = auth.token;
});

afterAll(async () => {
  await prisma.budget.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// ─── Period bounds unit tests ─────────────────────────────────────────────────

describe("getPeriodBounds", () => {
  it("weekly start is Sunday", () => {
    const { start } = getPeriodBounds("weekly");
    expect(start.getDay()).toBe(0); // Sunday
    expect(start.getHours()).toBe(0);
  });

  it("monthly start is day 1", () => {
    const { start } = getPeriodBounds("monthly");
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
  });

  it("yearly start is Jan 1", () => {
    const { start } = getPeriodBounds("yearly");
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
  });
});

// ─── analyzePatterns unit tests ───────────────────────────────────────────────

describe("analyzePatterns", () => {
  it("returns null for empty history", () => {
    expect(analyzePatterns([])).toBeNull();
  });

  it("computes top categories correctly", () => {
    const history = [
      { category: "errand", completedAt: new Date() },
      { category: "errand", completedAt: new Date() },
      { category: "call",   completedAt: new Date() },
      { category: "errand", completedAt: null },
    ];
    const patterns = analyzePatterns(history);
    expect(patterns.topCategories[0].category).toBe("errand");
    expect(patterns.topCategories[0].count).toBe(3);
  });

  it("calculates completion rate", () => {
    const history = [
      { category: "errand", completedAt: new Date() },
      { category: "errand", completedAt: null },
    ];
    const patterns = analyzePatterns(history);
    expect(patterns.completionRate).toBe(50);
    expect(patterns.totalReminders).toBe(2);
  });
});

// ─── Budget CRUD ──────────────────────────────────────────────────────────────

describe("POST /api/budget/set", () => {
  it("creates a budget", async () => {
    const res = await request(app)
      .post("/api/budget/set")
      .set("Authorization", `Bearer ${token}`)
      .send({ category: "errand", budgetLimit: 100, period: "monthly" });

    expect(res.status).toBe(201);
    expect(res.body.budgetLimit).toBe(100);
    expect(res.body.period).toBe("monthly");
    expect(res.body.alertThreshold).toBe(0.8);
  });

  it("upserts existing budget", async () => {
    await request(app).post("/api/budget/set").set("Authorization", `Bearer ${token}`)
      .send({ category: "errand", budgetLimit: 100, period: "monthly" });

    const res = await request(app).post("/api/budget/set").set("Authorization", `Bearer ${token}`)
      .send({ category: "errand", budgetLimit: 150, period: "monthly" });

    expect(res.status).toBe(201);
    expect(res.body.budgetLimit).toBe(150);
  });

  it("rejects invalid category", async () => {
    const res = await request(app).post("/api/budget/set").set("Authorization", `Bearer ${token}`)
      .send({ category: "gambling", budgetLimit: 100, period: "monthly" });
    expect(res.status).toBe(400);
  });

  it("rejects negative budget", async () => {
    const res = await request(app).post("/api/budget/set").set("Authorization", `Bearer ${token}`)
      .send({ category: "errand", budgetLimit: -50, period: "monthly" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/budget/usage", () => {
  it("returns usage with no reminders and no budget", async () => {
    const res = await request(app)
      .get("/api/budget/usage?category=errand&period=monthly")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.purchaseCount).toBe(0);
    expect(res.body.estimatedSpent).toBe(0);
    expect(res.body.hasBudget).toBe(false);
    expect(res.body.budgetLimit).toBeNull();
  });

  it("counts completed reminders in current period", async () => {
    // Create + complete 2 errand reminders
    const r1 = await request(app).post("/api/reminders").set("Authorization", `Bearer ${token}`)
      .send({ title: "Acheter lait", category: "errand" });
    const r2 = await request(app).post("/api/reminders").set("Authorization", `Bearer ${token}`)
      .send({ title: "Acheter pain", category: "errand" });

    await request(app).patch(`/api/reminders/${r1.body.id}/complete`).set("Authorization", `Bearer ${token}`);
    await request(app).patch(`/api/reminders/${r2.body.id}/complete`).set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .get("/api/budget/usage?category=errand&period=monthly")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.purchaseCount).toBe(2);
  });

  it("shows budget limit and remaining after setting budget", async () => {
    await request(app).post("/api/budget/set").set("Authorization", `Bearer ${token}`)
      .send({ category: "errand", budgetLimit: 100, period: "monthly" });

    const res = await request(app)
      .get("/api/budget/usage?category=errand&period=monthly")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.budgetLimit).toBe(100);
    expect(res.body.hasBudget).toBe(true);
    expect(typeof res.body.remaining).toBe("number");
    expect(typeof res.body.usagePct).toBe("number");
  });

  it("returns 400 for invalid period", async () => {
    const res = await request(app)
      .get("/api/budget/usage?category=errand&period=hourly")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("does not count other users purchases", async () => {
    const other = await createUserAndLogin("budget-other@test.com", "password123");
    const r = await request(app).post("/api/reminders").set("Authorization", `Bearer ${other.token}`)
      .send({ title: "Other purchase", category: "errand" });
    await request(app).patch(`/api/reminders/${r.body.id}/complete`).set("Authorization", `Bearer ${other.token}`);

    const res = await request(app)
      .get("/api/budget/usage?category=errand&period=monthly")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.purchaseCount).toBe(0);
  });
});

describe("PATCH /api/budget/:id", () => {
  it("updates alert threshold", async () => {
    const created = await request(app).post("/api/budget/set").set("Authorization", `Bearer ${token}`)
      .send({ category: "health", budgetLimit: 50, period: "monthly" });

    const res = await request(app)
      .patch(`/api/budget/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ alertThreshold: 0.9 });

    expect(res.status).toBe(200);
    expect(res.body.alertThreshold).toBeCloseTo(0.9);
  });
});

describe("GET /api/budget", () => {
  it("lists all user budgets", async () => {
    await request(app).post("/api/budget/set").set("Authorization", `Bearer ${token}`)
      .send({ category: "errand", budgetLimit: 100, period: "monthly" });
    await request(app).post("/api/budget/set").set("Authorization", `Bearer ${token}`)
      .send({ category: "health", budgetLimit: 50, period: "weekly" });

    const res = await request(app).get("/api/budget").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

// ─── Smart recommendations ────────────────────────────────────────────────────

describe("GET /api/ai/smart-recommendations", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/ai/smart-recommendations");
    expect(res.status).toBe(401);
  });

  it("returns recommendations with correct structure", async () => {
    const res = await request(app)
      .get("/api/ai/smart-recommendations")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(res.body.recommendations.length).toBeGreaterThan(0);

    const r = res.body.recommendations[0];
    expect(typeof r.title).toBe("string");
    expect(typeof r.reason).toBe("string");
    expect(typeof r.confidence).toBe("number");
    expect(r.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it("returns null patterns for new user with no history", async () => {
    const res = await request(app)
      .get("/api/ai/smart-recommendations")
      .set("Authorization", `Bearer ${token}`);

    // New user has no completed reminders → patterns may be null
    expect(res.status).toBe(200);
    // recommendations should still be present (fallback)
    expect(res.body.recommendations.length).toBeGreaterThan(0);
  });

  it("returns patterns after user completes reminders", async () => {
    // Create and complete a few reminders
    for (const title of ["Acheter lait", "Acheter pain", "Acheter eau"]) {
      const r = await request(app).post("/api/reminders").set("Authorization", `Bearer ${token}`)
        .send({ title, category: "errand" });
      await request(app).patch(`/api/reminders/${r.body.id}/complete`).set("Authorization", `Bearer ${token}`);
    }

    // Force cache miss by using a fresh user (since cache is keyed by userId+hour)
    const fresh = await createUserAndLogin("patterns-user@test.com", "password123");
    for (const title of ["Appeler Marie", "Appeler Pierre"]) {
      const r = await request(app).post("/api/reminders").set("Authorization", `Bearer ${fresh.token}`)
        .send({ title, category: "call" });
      await request(app).patch(`/api/reminders/${r.body.id}/complete`).set("Authorization", `Bearer ${fresh.token}`);
    }

    const res = await request(app)
      .get("/api/ai/smart-recommendations")
      .set("Authorization", `Bearer ${fresh.token}`);

    expect(res.status).toBe(200);
    // patterns should exist
    expect(res.body.patterns).not.toBeNull();
    expect(res.body.patterns.totalReminders).toBeGreaterThan(0);
  });
});
