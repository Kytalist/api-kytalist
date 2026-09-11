import type { ContestSyncService } from "../services/contestSyncService.js";
import { getLogger } from "./logger.js";

const log = getLogger();

/** Milliseconds from now until the next occurrence of `hourUtc:00:00` UTC. */
export function msUntilNextUtcHour(hourUtc: number): number {
  const now = new Date();
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hourUtc,
      0,
      0,
      0,
    ),
  );
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - now.getTime();
}

/**
 * Runs the contest sync daily at the configured UTC hour (default 00:00) and
 * seeds an empty catalog on boot. Long-lived process only (server.ts) — never
 * started from the serverless entrypoint (index.ts).
 */
export function startContestScheduler(sync: ContestSyncService): void {
  if (process.env["CONTEST_SYNC_ENABLED"] === "false") {
    log.info("contest sync: scheduler disabled");
    return;
  }

  const configured = Number(process.env["CONTEST_SYNC_HOUR_UTC"] ?? 0);
  const hour = Number.isFinite(configured) ? configured : 0;

  const run = async (): Promise<void> => {
    try {
      const result = await sync.sync();
      log.info({ result }, "contest sync complete");
    } catch (err) {
      log.error({ err }, "contest sync failed");
    }
  };

  const schedule = (): void => {
    const delay = msUntilNextUtcHour(hour);
    setTimeout(() => {
      void run().finally(schedule);
    }, delay).unref();
  };

  schedule();
  log.info({ hourUtc: hour }, "contest sync: scheduler started");

  void sync
    .ensureSeeded()
    .then((result) => {
      if (result) log.info({ result }, "contest sync: seeded empty catalog");
    })
    .catch((err) => log.error({ err }, "contest sync: boot seed failed"));
}
