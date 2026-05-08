const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const app = require("../src/index");

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) });

beforeEach(async () => {
  await prisma.reminder.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.reminder.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("POST /api/auth/signup", () => {
  it("creates a user and returns tokens", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      email: "thomas@test.com",
      password: "password123",
      name: "Thomas",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("thomas@test.com");
    expect(res.body.user.tier).toBe("free");
    expect(res.body.access).toBeDefined();
    expect(res.body.refresh).toBeDefined();
  });

  it("rejects duplicate email", async () => {
    await request(app).post("/api/auth/signup").send({ email: "dup@test.com", password: "password123" });
    const res = await request(app).post("/api/auth/signup").send({ email: "dup@test.com", password: "password123" });
    expect(res.status).toBe(409);
  });

  it("rejects short password", async () => {
    const res = await request(app).post("/api/auth/signup").send({ email: "a@test.com", password: "short" });
    expect(res.status).toBe(400);
  });

  it("rejects missing email", async () => {
    const res = await request(app).post("/api/auth/signup").send({ password: "password123" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/signup").send({ email: "login@test.com", password: "password123" });
  });

  it("returns tokens on valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "login@test.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.access).toBeDefined();
  });

  it("rejects wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "login@test.com", password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  it("rejects unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "ghost@test.com", password: "password123" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/refresh", () => {
  it("returns new tokens with valid refresh token", async () => {
    const signup = await request(app).post("/api/auth/signup").send({ email: "refresh@test.com", password: "password123" });
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: signup.body.refresh });
    expect(res.status).toBe(200);
    expect(res.body.access).toBeDefined();
  });

  it("rejects invalid refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: "bad.token.here" });
    expect(res.status).toBe(401);
  });
});
