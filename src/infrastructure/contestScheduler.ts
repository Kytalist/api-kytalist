import type { ContestSyncService } from "../services/contestSyncService.js";
import { getLogger } from "./logger.js";

const log = getLogger();

/** Sync interval in minutes (default 60 = hourly, floor 5 to respect the API). */
function intervalMinutes(): number {
  const raw = Number(process.env["CONTEST_SYNC_INTERVAL_MINUTES"] ?? 60);
  if (!Number.isFinite(raw) || raw <= 0) return 60;
  return Math.max(5, Math.floor(raw));
}

/**
 * Runs the contest sync on a fixed interval (default hourly) and seeds an empty
 * catalog on boot. Long-lived process only (server.ts) — never started from the
 * serverless entrypoint (index.ts).
 */
export function startContestScheduler(sync: ContestSyncService): void {
  if (process.env["CONTEST_SYNC_ENABLED"] === "false") {
    log.info("contest sync: scheduler disabled");
    return;
  }

  const minutes = intervalMinutes();
  const everyMs = minutes * 60 * 1000;

  const run = async (): Promise<void> => {
    try {
      const result = await sync.sync();
      log.info({ result }, "contest sync complete");
    } catch (err) {
      log.error({ err }, "contest sync failed");
    }
  };

  const schedule = (): void => {
    setTimeout(() => {
      void run().finally(schedule);
    }, everyMs).unref();
  };

  schedule();
  log.info({ intervalMinutes: minutes }, "contest sync: scheduler started");

  void sync
    .ensureSeeded()
    .then((result) => {
      if (result) log.info({ result }, "contest sync: seeded empty catalog");
    })
    .catch((err) => log.error({ err }, "contest sync: boot seed failed"));
}
