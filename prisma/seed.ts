import { loadEnv } from "../src/infrastructure/loadEnv.js";

loadEnv();
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import pg from "pg";
import { seedListings } from "./seed-data.js";

/** Stable ids so `npm run db:seed` is idempotent. */
const seedTestimonials = [
  {
    id: "tm_seed_maya",
    name: "Maya Patel",
    role: "11th grade · Austin, TX",
    quote:
      "I found a robotics camp two states away that I never would have heard of otherwise. The filters made it so easy to pick one that actually fit my summer.",
    order: 1,
  },
  {
    id: "tm_seed_jordan",
    name: "Jordan Reyes",
    role: "12th grade · Brooklyn, NY",
    quote:
      "Kytalist is the first place I've seen internships for high schoolers that aren't just resume-bait. I landed a paid research role at a local lab because of it.",
    order: 2,
  },
  {
    id: "tm_seed_elena",
    name: "Elena Sørensen",
    role: "Parent · Minneapolis, MN",
    quote:
      "We used to spend whole weekends hunting for clubs. Now my daughter and I browse together for fifteen minutes and actually find things worth applying to.",
    order: 3,
  },
] as const;

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

    for (const t of seedTestimonials) {
      await prisma.testimonial.upsert({
        where: { id: t.id },
        create: {
          id: t.id,
          name: t.name,
          role: t.role,
          quote: t.quote,
          published: true,
          order: t.order,
        },
        update: {
          name: t.name,
          role: t.role,
          quote: t.quote,
          published: true,
          order: t.order,
        },
      });
    }
    console.log(`Seeded ${seedTestimonials.length} published testimonials`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
