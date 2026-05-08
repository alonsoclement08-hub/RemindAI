const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 1,
});

redis.on("error", (err) => {
  if (process.env.NODE_ENV !== "test") console.error("Redis error:", err.message);
});

module.exports = redis;
