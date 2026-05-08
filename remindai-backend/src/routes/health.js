const express = require("express");
const prisma = require("../services/prisma");
const redis = require("../services/redis");

const router = express.Router();
const startTime = Date.now();

router.get("/", async (req, res) => {
  const t0 = Date.now();
  const checks = { db: false, redis: false };

  await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`.then(() => { checks.db = true; }),
    redis.ping().then(() => { checks.redis = true; }),
  ]);

  const allOk = checks.db && checks.redis;

  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    version: "1.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    responseMs: Date.now() - t0,
    checks,
  });
});

module.exports = router;
