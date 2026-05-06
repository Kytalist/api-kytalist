import { AppError } from "../domain/AppError.js";
import type { ListingJson } from "../domain/listing.dto.js";
import { SavedListingRepository } from "../repositories/savedListingRepository.js";
import { toListingJson } from "./listingService.js";

export type SavedListingJson = {
  listingId: string;
  createdAt: string;
  listing: ListingJson;
};

export class SavedListingService {
  constructor(private readonly repo: SavedListingRepository) {}

  async list(userId: string): Promise<SavedListingJson[]> {
    const rows = await this.repo.findForUser(userId);
    return rows.map((r) => ({
      listingId: r.listingId,
      createdAt: r.createdAt.toISOString(),
      listing: toListingJson(r.listing),
    }));
  }

  async save(userId: string, listingId: string): Promise<SavedListingJson> {
    if (!listingId) {
      throw new AppError("listingId is required", 400, "BAD_REQUEST");
    }
    const row = await this.repo.create(userId, listingId);
    const fullRows = await this.repo.findForUser(userId);
    const match = fullRows.find((r) => r.listingId === listingId);
    if (!match) {
      throw new AppError("Listing not found", 404, "NOT_FOUND");
    }
    return {
      listingId: row.listingId,
      createdAt: row.createdAt.toISOString(),
      listing: toListingJson(match.listing),
    };
  }

  async unsave(userId: string, listingId: string): Promise<void> {
    await this.repo.delete(userId, listingId);
  }
}
