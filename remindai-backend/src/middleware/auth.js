const jwt = require("jsonwebtoken");
const redis = require("../services/redis");

module.exports = async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token", detail: err.name });
  }
  try {
    const blacklisted = await redis.get(`blacklist:${token}`);
    if (blacklisted) return res.status(401).json({ error: "Token has been revoked" });
  } catch {
    // Redis unavailable — allow request, blacklist check skipped
  }
  next();
};
