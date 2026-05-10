import { config } from "dotenv";
import { resolve } from "node:path";

/**
 * Load environment variables from `.env` file.
 * For production, use platform environment variables directly.
 */
export function loadEnv(cwd: string = process.cwd()): void {
  config({ path: resolve(cwd, ".env") });
}
