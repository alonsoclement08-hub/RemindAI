const request = require("supertest");
const app = require("../src/index");

async function createUserAndLogin(email = "test@remindai.com", password = "password123") {
  await request(app).post("/api/auth/signup").send({ email, password, name: "Test User" });
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return { token: res.body.access, userId: res.body.user?.id };
}

module.exports = { createUserAndLogin, app };
