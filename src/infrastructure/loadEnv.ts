import { config } from "dotenv";
import { resolve } from "node:path";

/**
 * Load env in order:
 * 1. `.env` — shared defaults (optional)
 * 2. `.env.local` — local overrides (gitignored); wins on duplicate keys
 *
 * Use `.env.local` for machine-only URLs (local Postgres, Supabase CLI) without
 * touching team `.env` or cloud secrets.
 */
export function loadEnv(cwd: string = process.cwd()): void {
  config({ path: resolve(cwd, ".env") });
  config({ path: resolve(cwd, ".env.local"), override: true });
}
