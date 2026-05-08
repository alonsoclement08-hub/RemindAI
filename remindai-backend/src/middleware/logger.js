const pino = require("pino");
const pinoHttp = require("pino-http");

const log = pino({
  level: process.env.LOG_LEVEL || "info",
  // Pretty-print locally; raw JSON in production (parsed by log aggregators)
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true, ignore: "pid,hostname" } }
      : undefined,
  base: { service: "remindai-backend", env: process.env.NODE_ENV },
  redact: ["req.headers.authorization"], // never log auth tokens
});

const requestLogger = pinoHttp({
  logger: log,
  quietReqLogger: true,
  customLogLevel(req, res, err) {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage(req, res, err) {
    return `${req.method} ${req.url} ${res.statusCode} — ${err.message}`;
  },
  serializers: {
    req(req) {
      return { method: req.method, url: req.url };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});

module.exports = { log, requestLogger };
