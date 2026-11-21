import pino from "pino";

export const logger = pino({
  level: process.env["LOG_LEVEL"] ?? "info",
  base: { service: "shopsphere" },
  redact: ["req.headers.authorization", "password", "*.password", "passwordHash"],
  ...(process.env["NODE_ENV"] !== "production" ? { transport: { target: "pino-pretty" } } : {}),
});
