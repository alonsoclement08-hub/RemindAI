const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const prisma = require("../services/prisma");
const redis = require("../services/redis");
const { validate } = require("../middleware/validate");
const authMiddleware = require("../middleware/auth");
const {
  signupSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../schemas/auth");

const router = express.Router();

const RESET_TOKEN_TTL = 900; // 15 minutes

function generateTokens(userId) {
  const access = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const refresh = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { access, refresh };
}

function tokenRemainingSeconds(token) {
  try {
    const { exp } = jwt.decode(token);
    return Math.max(0, exp - Math.floor(Date.now() / 1000));
  } catch {
    return 0;
  }
}

// POST /api/auth/signup
router.post("/signup", validate(signupSchema), async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash, name } });

    const tokens = generateTokens(user.id);
    res.status(201).json({ user: { id: user.id, email: user.email, tier: user.tier }, ...tokens });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const tokens = generateTokens(user.id);
    res.json({ user: { id: user.id, email: user.email, tier: user.tier }, ...tokens });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/refresh
router.post("/refresh", validate(refreshSchema), async (req, res) => {
  const { refreshToken } = req.body;
  try {
    const blacklisted = await redis.get(`blacklist:${refreshToken}`);
    if (blacklisted) return res.status(401).json({ error: "Token has been revoked" });

    const { userId } = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokens = generateTokens(userId);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// POST /api/auth/logout
router.post("/logout", authMiddleware, async (req, res) => {
  const token = req.headers.authorization.slice(7);
  const { refreshToken } = req.body || {};
  try {
    const ttl = tokenRemainingSeconds(token);
    if (ttl > 0) await redis.setex(`blacklist:${token}`, ttl, "1");

    if (refreshToken) {
      const refreshTtl = tokenRemainingSeconds(refreshToken);
      if (refreshTtl > 0) await redis.setex(`blacklist:${refreshToken}`, refreshTtl, "1");
    }
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", validate(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return 200 to avoid email enumeration
    if (!user) return res.json({ message: "If that email exists, a reset link has been sent" });

    const resetToken = randomUUID();
    await redis.setex(`reset:${resetToken}`, RESET_TOKEN_TTL, user.id);

    if (process.env.NODE_ENV === "test") {
      return res.json({ message: "Reset link sent", resetToken });
    }
    console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`);
    res.json({ message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", validate(resetPasswordSchema), async (req, res) => {
  const { token, password } = req.body;
  try {
    const userId = await redis.get(`reset:${token}`);
    if (!userId) return res.status(400).json({ error: "Invalid or expired reset token" });

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await redis.del(`reset:${token}`);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
