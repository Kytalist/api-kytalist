import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import pg from "pg";

let prisma: PrismaClient | null = null;
let pool: pg.Pool | null = null;

/**
 * Runtime DB URL (pooled), e.g. Supabase `DATABASE_URL`.
 * Migrations use `DIRECT_URL` via prisma.config.ts — keep local vs prod values in `.env` only.
 */
export function getPrisma(): PrismaClient {
  if (prisma) return prisma;

  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set to connect to the database");
  }

  pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
  return prisma;
}

/** For tests or graceful shutdown (optional). */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
  if (pool) {
    await pool.end();
    pool = null;
  }
}
