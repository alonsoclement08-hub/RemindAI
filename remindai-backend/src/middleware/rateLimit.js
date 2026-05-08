const rateLimit = require("express-rate-limit");

const isTest = process.env.NODE_ENV === "test";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 10000 : 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 10000 : 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later" },
});

module.exports = { apiLimiter, authLimiter };
