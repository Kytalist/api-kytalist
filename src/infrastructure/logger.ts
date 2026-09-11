import pino, { type Logger } from "pino";

let logger: Logger | null = null;

export function getLogger(): Logger {
  if (logger) return logger;

  const level = process.env["LOG_LEVEL"] ?? "info";
  const isProd = process.env["NODE_ENV"] === "production";

  const redact = {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.confirmToken",
      "*.unsubToken",
    ],
    remove: true,
  };

  if (!isProd) {
    try {
      logger = pino({
        level,
        redact,
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss.l" },
        },
      });
      return logger;
    } catch {
      // pino-pretty not available (e.g. production image with NODE_ENV mismatch)
    }
  }

  logger = pino({ level, redact });
  return logger;
}
