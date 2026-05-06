import { execSync } from "node:child_process";
import pg from "pg";

/**
 * Tests run against a transient Postgres schema named `test_<run-id>`.
 * The schema is created, migrations are applied via a search_path-scoped
 * connection string, and the schema is dropped after the run.
 *
 * Required env: TEST_DATABASE_URL (defaults to DATABASE_URL).
 * Skips if neither is set.
 */
const SCHEMA = `test_${process.pid}_${Date.now().toString(36)}`;

export type DbHandle = {
  schema: string;
  url: string;
  /** Truncate all tables (preserving schema). */
  reset: () => Promise<void>;
  /** Drop the schema. */
  teardown: () => Promise<void>;
};

function buildUrlWithSchema(base: string, schema: string): string {
  const u = new URL(base);
  u.searchParams.set("schema", schema);
  return u.toString();
}

export async function setupTestDb(): Promise<DbHandle | null> {
  const base = process.env["TEST_DATABASE_URL"] ?? process.env["DATABASE_URL"];
  if (!base) return null;

  const adminPool = new pg.Pool({ connectionString: base });
  await adminPool.query(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA}"`);
  await adminPool.end();

  const url = buildUrlWithSchema(base, SCHEMA);
  process.env["DATABASE_URL"] = url;
  process.env["DIRECT_URL"] = url;

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });

  const reset = async () => {
    const pool = new pg.Pool({ connectionString: url });
    try {
      const tables = await pool.query<{ tablename: string }>(
        `SELECT tablename FROM pg_tables WHERE schemaname = $1`,
        [SCHEMA],
      );
      if (tables.rows.length === 0) return;
      const list = tables.rows.map((r) => `"${SCHEMA}"."${r.tablename}"`).join(", ");
      await pool.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
    } finally {
      await pool.end();
    }
  };

  const teardown = async () => {
    const pool = new pg.Pool({ connectionString: base });
    try {
      await pool.query(`DROP SCHEMA "${SCHEMA}" CASCADE`);
    } finally {
      await pool.end();
    }
  };

  return { schema: SCHEMA, url, reset, teardown };
}
