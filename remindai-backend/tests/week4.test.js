const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const Redis = require("ioredis");
const { createUserAndLogin, app } = require("./helpers");

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) });
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

beforeEach(async () => {
  await prisma.reminder.deleteMany();
  await prisma.user.deleteMany();
  await redis.flushdb();
});

afterAll(async () => {
  await prisma.reminder.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
  await redis.quit();
});

// ─── LOGOUT & TOKEN BLACKLIST ────────────────────────────────────────────────

describe("POST /api/auth/logout", () => {
  it("invalidates access token after logout", async () => {
    const { token } = await createUserAndLogin("logout@test.com");

    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const res = await request(app)
      .get("/api/reminders")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token has been revoked");
  });

  it("also invalidates refresh token on logout", async () => {
    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email: "logoutrefresh@test.com", password: "password123" });

    const { access, refresh } = signup.body;

    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${access}`)
      .send({ refreshToken: refresh })
      .expect(200);

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: refresh });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token has been revoked");
  });

  it("requires authentication to logout", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(401);
  });
});

// ─── PASSWORD RESET FLOW ─────────────────────────────────────────────────────

describe("Password reset flow", () => {
  it("forgot-password returns reset token in test env", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ email: "reset@test.com", password: "oldpassword" });

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "reset@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.resetToken).toBeDefined();
  });

  it("forgot-password returns 200 even for unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ghost@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.resetToken).toBeUndefined();
  });

  it("reset-password updates password and old credentials fail", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ email: "pwreset@test.com", password: "oldpassword" });

    const forgot = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "pwreset@test.com" });

    const { resetToken } = forgot.body;

    await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, password: "newpassword123" })
      .expect(200);

    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "pwreset@test.com", password: "oldpassword" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "pwreset@test.com", password: "newpassword123" });
    expect(newLogin.status).toBe(200);
  });

  it("reset token is single-use", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ email: "single@test.com", password: "password123" });

    const forgot = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "single@test.com" });

    const { resetToken } = forgot.body;
    await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, password: "newpassword123" });

    const secondUse = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, password: "anotherpassword" });
    expect(secondUse.status).toBe(400);
  });

  it("rejects invalid reset token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "fake-token-uuid", password: "newpassword123" });
    expect(res.status).toBe(400);
  });
});

// ─── ZOD INPUT VALIDATION ────────────────────────────────────────────────────

describe("Input validation", () => {
  it("signup rejects invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "not-an-email", password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe("email");
  });

  it("signup rejects password under 8 chars", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "valid@test.com", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe("password");
  });

  it("reminder rejects invalid category", async () => {
    const { token } = await createUserAndLogin("catval@test.com");
    const res = await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test", category: "invalid_category" });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe("category");
  });

  it("reminder rejects priority out of range", async () => {
    const { token } = await createUserAndLogin("prival@test.com");
    const res = await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test", priority: 10 });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe("priority");
  });

  it("reminder rejects missing title", async () => {
    const { token } = await createUserAndLogin("titleval@test.com");
    const res = await request(app)
      .post("/api/reminders")
      .set("Authorization", `Bearer ${token}`)
      .send({ priority: 1 });
    expect(res.status).toBe(400);
  });
});

// ─── TOKEN REFRESH ───────────────────────────────────────────────────────────

describe("Token refresh", () => {
  it("refresh returns new access and refresh tokens", async () => {
    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email: "refreshflow@test.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: signup.body.refresh });

    expect(res.status).toBe(200);
    expect(res.body.access).toBeDefined();
    expect(res.body.refresh).toBeDefined();
  });

  it("new access token works for authenticated requests", async () => {
    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ email: "newaccesstoken@test.com", password: "password123" });

    const refreshed = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: signup.body.refresh });

    const res = await request(app)
      .get("/api/reminders")
      .set("Authorization", `Bearer ${refreshed.body.access}`);
    expect(res.status).toBe(200);
  });

  it("rejects missing refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});
    expect(res.status).toBe(400);
  });
});
