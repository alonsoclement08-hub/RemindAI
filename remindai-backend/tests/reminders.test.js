const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { createUserAndLogin, app } = require("./helpers");

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) });

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

describe("POST /api/reminders", () => {
  it("creates a reminder for authenticated user", async () => {
    const res = await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Appeler Jean", scheduledAt: "2026-05-10T15:00:00Z", priority: 1, category: "work" });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Appeler Jean");
    expect(res.body.syncStatus).toBe("pending");
  });

  it("rejects unauthenticated request", async () => {
    const res = await request(app).post("/api/reminders").send({ title: "Test" });
    expect(res.status).toBe(401);
  });

  it("rejects missing title", async () => {
    const res = await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({ priority: 1 });
    expect(res.status).toBe(400);
  });

  it("enforces free tier limit of 20 reminders", async () => {
    for (let i = 0; i < 20; i++) {
      await request(app)
        .post("/api/reminders")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: `Reminder ${i}` });
    }
    const res = await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "One too many" });
    expect(res.status).toBe(429);
    expect(res.body.upgrade).toBe(true);
  });
});

describe("GET /api/reminders", () => {
  it("returns empty list initially", async () => {
    const res = await request(app).get("/api/reminders").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns created reminders", async () => {
    await request(app).post("/api/reminders").set("Authorization", `Bearer ${token}`).send({ title: "Task A" });
    await request(app).post("/api/reminders").set("Authorization", `Bearer ${token}`).send({ title: "Task B" });
    const res = await request(app).get("/api/reminders").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("does not return other users reminders", async () => {
    const other = await createUserAndLogin("other@test.com", "password123");
    await request(app).post("/api/reminders").set("Authorization", `Bearer ${other.token}`).send({ title: "Private" });
    const res = await request(app).get("/api/reminders").set("Authorization", `Bearer ${token}`);
    expect(res.body).toHaveLength(0);
  });
});

describe("PUT /api/reminders/:id", () => {
  it("updates a reminder", async () => {
    const created = await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Original" });
    const res = await request(app)
      .put(`/api/reminders/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated", priority: 1 });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated");
    expect(res.body.priority).toBe(1);
  });

  it("returns 404 for another user's reminder", async () => {
    const other = await createUserAndLogin("other2@test.com", "password123");
    const created = await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${other.token}`)
      .send({ title: "Not yours" });
    const res = await request(app)
      .put(`/api/reminders/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Hacked" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/reminders/:id", () => {
  it("soft deletes a reminder", async () => {
    const created = await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "To delete" });
    const del = await request(app)
      .delete(`/api/reminders/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);

    const list = await request(app).get("/api/reminders").set("Authorization", `Bearer ${token}`);
    expect(list.body).toHaveLength(0);
  });
});

describe("PATCH /api/reminders/:id/complete", () => {
  it("marks a reminder as completed", async () => {
    const created = await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Call Jean" });
    const res = await request(app)
      .patch(`/api/reminders/${created.body.id}/complete`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.completedAt).toBeDefined();
  });
});
