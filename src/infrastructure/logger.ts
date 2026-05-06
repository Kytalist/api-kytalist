import pino, { type Logger } from "pino";

let logger: Logger | null = null;

export function getLogger(): Logger {
  if (logger) return logger;

  const level = process.env["LOG_LEVEL"] ?? "info";
  const isProd = process.env["NODE_ENV"] === "production";

  logger = pino({
    level,
    redact: {
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
    },
    ...(isProd
      ? {}
      : {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "HH:MM:ss.l" },
          },
        }),
  });
  return logger;
}
