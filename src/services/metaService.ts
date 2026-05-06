import type { ListingRepository } from "../repositories/listingRepository.js";

/** Static catalog metadata for kytalist clients (tier 2 — no DB). */
export function getMetaPayload() {
  return {
    regions: [
      "All regions",
      "Northeast",
      "Southeast",
      "Midwest",
      "Southwest",
      "Pacific",
      "Mountain",
      "Nationwide",
    ],
    extracurricularTypes: [
      "All",
      "Competition",
      "Research",
      "Program",
      "Club",
      "Volunteer",
      "Leadership",
      "Arts",
      "STEM",
    ],
    costOptions: ["Any cost", "Free", "Paid", "Stipend"],
    gradeOptions: [9, 10, 11, 12],
    sortOptions: [
      { value: "deadline", label: "Deadline soonest" },
      { value: "alpha", label: "A → Z" },
      { value: "recent", label: "Recently added" },
    ],
  };
}

type CountsCache = {
  expiresAt: number;
  payload: Record<string, number>;
};

const COUNTS_TTL_MS = 60_000;

export class MetaService {
  private cache: CountsCache | null = null;

  constructor(private readonly listings: ListingRepository) {}

  async getCategoryCounts(): Promise<Record<string, number>> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache.payload;
    }
    const rows = await this.listings.groupByCategory();
    const payload: Record<string, number> = {};
    for (const r of rows) payload[r.category] = r.count;
    this.cache = { expiresAt: now + COUNTS_TTL_MS, payload };
    return payload;
  }
}
