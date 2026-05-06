import { Prisma, type Listing } from "../../generated/prisma/client.js";
import { getPrisma } from "../infrastructure/prisma.js";

/**
 * Data access layer — Prisma queries only (tier 3).
 */
export class ListingRepository {
  async findMany(where: Prisma.ListingWhereInput): Promise<Listing[]> {
    return getPrisma().listing.findMany({ where });
  }

  async findById(id: string): Promise<Listing | null> {
    return getPrisma().listing.findUnique({ where: { id } });
  }

  async findFeatured(): Promise<Listing[]> {
    return getPrisma().listing.findMany({
      where: { featuredOrder: { not: null } },
      orderBy: { featuredOrder: "asc" },
    });
  }
}
