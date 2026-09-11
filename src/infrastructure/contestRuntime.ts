import { ListingRepository } from "../repositories/listingRepository.js";
import { ContestSyncService } from "../services/contestSyncService.js";

let instance: ContestSyncService | null = null;

/**
 * Shared ContestSyncService so the HTTP route and the in-process scheduler use
 * the same stateless repository instance.
 */
export function getContestSyncService(): ContestSyncService {
  if (!instance) {
    instance = new ContestSyncService(new ListingRepository());
  }
  return instance;
}
