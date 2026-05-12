const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { createUserAndLogin, app } = require("./helpers");

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) });

// Mock gemma so tests don't require Ollama
jest.mock("../src/services/gemma", () => {
  const original = jest.requireActual("../src/services/gemma");
  return {
    ...original,
    callGemma: jest.fn().mockResolvedValue(
      '{"aiNote":"Tu as des tâches importantes. Commence par la première !","motivationalMessage":"Bonne journée ! 🎯"}'
    ),
    extractJSON: original.extractJSON,
  };
});

let token;

beforeEach(async () => {
  await prisma.reminder.deleteMany();
  await prisma.user.deleteMany();
  const auth = await createUserAndLogin();
  token = auth.token;
});

afterAll(async () => {
  await prisma.reminder.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("GET /api/dashboard/daily-summary", () => {
  it("returns empty summary when no reminders", async () => {
    const res = await request(app)
      .get("/api/dashboard/daily-summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      urgentCount: 0,
      todoCount: 0,
      completedToday: 0,
    });
    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof res.body.aiNote).toBe("string");
    expect(typeof res.body.motivationalMessage).toBe("string");
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });

  it("requires authentication", async () => {
    const res = await request(app).get("/api/dashboard/daily-summary");
    expect(res.status).toBe(401);
  });

  it("counts pending and urgent reminders correctly", async () => {
    // 2 urgent (priority 4), 1 high (priority 3), 2 normal
    await request(app).post("/api/reminders").set("Authorization", `Bearer ${token}`).send({ title: "URGENT A", priority: 4 });
    await request(app).post("/api/reminders").set("Authorization", `Bearer ${token}`).send({ title: "URGENT B", priority: 4 });
    await request(app).post("/api/reminders").set("Authorization", `Bearer ${token}`).send({ title: "HIGH",    priority: 3 });
    await request(app).post("/api/reminders").set("Authorization", `Bearer ${token}`).send({ title: "Normal A", priority: 2 });
    await request(app).post("/api/reminders").set("Authorization", `Bearer ${token}`).send({ title: "Normal B", priority: 1 });

    const res = await request(app)
      .get("/api/dashboard/daily-summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.todoCount).toBe(5);       // all 5 are pending
    expect(res.body.urgentCount).toBe(3);     // priority >= 3
    expect(res.body.completedToday).toBe(0);
  });

  it("counts completed-today correctly", async () => {
    const created = await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Done", priority: 2 });

    await request(app)
      .patch(`/api/reminders/${created.body.id}/complete`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .get("/api/dashboard/daily-summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.completedToday).toBe(1);
    expect(res.body.todoCount).toBe(0);
  });

  it("returns max 3 recommendations sorted by priority", async () => {
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post("/api/reminders")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: `Task ${i}`, priority: i > 4 ? 4 : i });
    }

    const res = await request(app)
      .get("/api/dashboard/daily-summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.recommendations.length).toBeLessThanOrEqual(3);
    // First recommendation should be the highest priority
    expect(["urgent", "high"]).toContain(res.body.recommendations[0].priority);
  });

  it("does not include other users reminders in summary", async () => {
    const other = await createUserAndLogin("other-dash@test.com", "password123");
    // Other user has 5 urgent reminders
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/reminders")
        .set("Authorization", `Bearer ${other.token}`)
        .send({ title: `Other urgent ${i}`, priority: 4 });
    }

    const res = await request(app)
      .get("/api/dashboard/daily-summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.urgentCount).toBe(0);
    expect(res.body.todoCount).toBe(0);
  });
});
