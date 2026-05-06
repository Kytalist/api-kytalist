import type { Listing, SavedListing } from "../../generated/prisma/client.js";
import { getPrisma } from "../infrastructure/prisma.js";

export type SavedWithListing = SavedListing & { listing: Listing };

export class SavedListingRepository {
  async findForUser(userId: string): Promise<SavedWithListing[]> {
    return getPrisma().savedListing.findMany({
      where: { userId },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(userId: string, listingId: string): Promise<SavedListing> {
    return getPrisma().savedListing.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: { userId, listingId },
      update: {},
    });
  }

  async delete(userId: string, listingId: string): Promise<void> {
    await getPrisma().savedListing.deleteMany({
      where: { userId, listingId },
    });
  }
}
