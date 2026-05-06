import "dotenv/config";
import { disconnectPrisma } from "./infrastructure/prisma.js";
import { getLogger } from "./infrastructure/logger.js";
import { createApp } from "./presentation/createApp.js";

const log = getLogger();
const app = createApp();
const PORT = Number(process.env["PORT"] ?? 3001);

const server = app.listen(PORT, () => {
  log.info({ port: PORT }, `api-kytalist listening on http://localhost:${PORT}`);
});

async function shutdown(signal: string): Promise<void> {
  log.info({ signal }, "Shutting down");
  server.close(() => log.info("HTTP server closed"));
  try {
    await disconnectPrisma();
  } catch (err) {
    log.error({ err }, "Error during prisma disconnect");
  }
  setTimeout(() => process.exit(0), 1000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
