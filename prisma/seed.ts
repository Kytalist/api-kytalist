import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import pg from "pg";
import { seedListings } from "./seed-data.js";

function keywordsFrom(tags: string[] | undefined): string {
  return (tags ?? []).join(" ").trim();
}

async function main(): Promise<void> {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for seeding");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    for (const row of seedListings) {
      const keywords = keywordsFrom(row.tags);
      await prisma.listing.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          title: row.title,
          org: row.org,
          location: row.location,
          region: row.region,
          description: row.description,
          image: row.image,
          category: row.category,
          badge: row.badge,
          footer: row.footer,
          deadline: row.deadline ?? null,
          type: row.type ?? null,
          cost: row.cost ?? null,
          grades: row.grades ?? [],
          tags: row.tags ?? [],
          keywords,
          deadlineAt: row.deadlineAt ?? null,
          featuredOrder: row.featuredOrder ?? null,
        },
        update: {
          title: row.title,
          org: row.org,
          location: row.location,
          region: row.region,
          description: row.description,
          image: row.image,
          category: row.category,
          badge: row.badge,
          footer: row.footer,
          deadline: row.deadline ?? null,
          type: row.type ?? null,
          cost: row.cost ?? null,
          grades: row.grades ?? [],
          tags: row.tags ?? [],
          keywords,
          deadlineAt: row.deadlineAt ?? null,
          featuredOrder: row.featuredOrder ?? null,
        },
      });
    }

    console.log(`Seeded ${seedListings.length} listings`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
