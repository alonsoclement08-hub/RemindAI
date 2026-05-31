require("dotenv/config");
const express = require("express");
const { apiLimiter, authLimiter } = require("./middleware/rateLimit");
const { requestLogger, log } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Structured request logging (skip in test to keep output clean)
if (process.env.NODE_ENV !== "test") {
  app.use(requestLogger);
}

app.use(express.json());

// Public — no auth required
app.use("/api/health", require("./routes/health"));

// Protected routes
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/reminders", apiLimiter, require("./routes/reminders"));
app.use("/api/dashboard", apiLimiter, require("./routes/dashboard"));
app.use("/api/location", apiLimiter, require("./routes/location"));
app.use("/api/products", apiLimiter, require("./routes/products"));
app.use("/api/budget", apiLimiter, require("./routes/budget"));
app.use("/api/ai", apiLimiter, require("./routes/ai"));
app.use("/api/sync", apiLimiter, require("./routes/sync"));
app.use("/api/integrations", apiLimiter, require("./routes/integrations"));
app.use("/api/analytics", apiLimiter, require("./routes/analytics"));
app.use("/api/weather",   apiLimiter, require("./routes/weather"));

app.use(errorHandler);

// Auto-run migrations before serving traffic in production
async function start() {
  if (process.env.NODE_ENV === "production") {
    const { execSync } = require("child_process");
    try {
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
      log.info("Database migrations applied");
    } catch (err) {
      log.error({ err }, "Migration failed — exiting");
      process.exit(1);
    }
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    if (process.env.NODE_ENV !== "test") {
      log.info({ port: PORT }, "Server started");
    }
  });
}

start();

module.exports = app;
