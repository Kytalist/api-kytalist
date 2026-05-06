import type { Listing, Prisma } from "../../generated/prisma/client.js";
import {
  CostOption,
  ExtracurricularType,
  ListingCategory,
} from "../../generated/prisma/enums.js";
import { AppError } from "../domain/AppError.js";
import type {
  CostOptionDto,
  ExtracurricularTypeDto,
  ListingJson,
  ListListingsQuery,
  ListingsSort,
} from "../domain/listing.dto.js";
import { ListingRepository } from "../repositories/listingRepository.js";

const LISTING_CATEGORIES = new Set<string>(Object.values(ListingCategory));
const EXTRACURRICULAR_TYPES = new Set<string>(Object.values(ExtracurricularType));
const COST_OPTIONS = new Set<string>(Object.values(CostOption));

/**
 * Business logic: filters, sorting, DTO mapping (tier 2).
 */
export class ListingService {
  constructor(private readonly repo: ListingRepository) {}

  async listFeatured(): Promise<ListingJson[]> {
    const rows = await this.repo.findFeatured();
    return rows.map((r) => toListingJson(r));
  }

  async getById(id: string): Promise<ListingJson> {
    if (!id) {
      throw new AppError("Listing id is required", 400, "BAD_REQUEST");
    }
    const row = await this.repo.findById(id);
    if (!row) {
      throw new AppError(`Listing not found: ${id}`, 404, "NOT_FOUND");
    }
    return toListingJson(row);
  }

  async list(query: ListListingsQuery): Promise<ListingJson[]> {
    const where = buildWhere(query);
    const rows = await this.repo.findMany(where);
    const sorted = sortListings(rows, query.sort);
    return sorted.slice(query.offset, query.offset + query.limit).map(toListingJson);
  }

  parseListQuery(raw: Record<string, string | undefined>): ListListingsQuery {
    const category = parseCategory(raw["category"]);
    const region = parseRegion(raw["region"]);
    const type = parseExtracurricularType(raw["type"]);
    const cost = parseCost(raw["cost"]);
    const grade = parseGrade(raw["grade"]);
    const q = raw["q"]?.trim() || undefined;
    const sort = parseSort(raw["sort"]);
    const limit = parseLimit(raw["limit"]);
    const offset = parseOffset(raw["offset"]);
    return {
      category,
      region,
      type,
      cost,
      grade,
      q,
      sort,
      limit,
      offset,
    };
  }
}

function buildWhere(q: ListListingsQuery): Prisma.ListingWhereInput {
  const and: Prisma.ListingWhereInput[] = [];

  if (q.category && q.category !== "all") {
    and.push({ category: q.category });
  }

  if (q.region) {
    and.push({ region: q.region });
  }

  if (q.type) {
    and.push({ type: q.type });
  }

  if (q.cost) {
    and.push({ cost: q.cost });
  }

  if (q.grade !== undefined) {
    and.push({ grades: { has: q.grade } });
  }

  if (q.q) {
    const term = q.q;
    const or: Prisma.ListingWhereInput[] = [
      { title: { contains: term, mode: "insensitive" } },
      { org: { contains: term, mode: "insensitive" } },
      { location: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { badge: { contains: term, mode: "insensitive" } },
      { keywords: { contains: term, mode: "insensitive" } },
    ];
    const typeEnum = extracurricularTypeFromSearch(term);
    if (typeEnum) {
      or.push({ type: typeEnum });
    }
    and.push({ OR: or });
  }

  return and.length ? { AND: and } : {};
}

function extracurricularTypeFromSearch(
  term: string,
): Prisma.EnumExtracurricularTypeNullableFilter | undefined {
  const hit = Object.values(ExtracurricularType).find(
    (v) => v.toLowerCase() === term.toLowerCase(),
  );
  return hit ? { equals: hit } : undefined;
}

function sortListings(rows: Listing[], sort: ListingsSort): Listing[] {
  const copy = [...rows];
  if (sort === "alpha") {
    copy.sort((a, b) => a.title.localeCompare(b.title));
    return copy;
  }
  if (sort === "recent") {
    copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return copy;
  }
  copy.sort((a, b) => {
    const aHas = a.deadline || a.deadlineAt ? 0 : 1;
    const bHas = b.deadline || b.deadlineAt ? 0 : 1;
    if (aHas !== bHas) return aHas - bHas;
    const aKey = a.deadlineAt?.getTime() ?? String(a.deadline ?? "");
    const bKey = b.deadlineAt?.getTime() ?? String(b.deadline ?? "");
    if (typeof aKey === "number" && typeof bKey === "number") {
      return aKey - bKey;
    }
    return String(aKey).localeCompare(String(bKey));
  });
  return copy;
}

export function toListingJson(row: Listing): ListingJson {
  const base: ListingJson = {
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
  };
  if (row.deadline) base.deadline = row.deadline;
  if (row.type) base.type = row.type;
  if (row.cost) base.cost = row.cost;
  if (row.grades.length > 0) base.grades = [...row.grades];
  if (row.tags.length > 0) base.tags = [...row.tags];
  return base;
}

function parseCategory(raw: string | undefined): ListListingsQuery["category"] {
  if (raw === undefined || raw === "") return "all";
  if (raw === "all") return "all";
  if (!LISTING_CATEGORIES.has(raw)) {
    throw new AppError(`Invalid category: ${raw}`, 400, "BAD_REQUEST");
  }
  return raw as ListListingsQuery["category"];
}

function parseRegion(raw: string | undefined): string | undefined {
  if (!raw || raw === "All regions") return undefined;
  return raw;
}

function parseExtracurricularType(
  raw: string | undefined,
): ExtracurricularTypeDto | undefined {
  if (!raw || raw === "All") return undefined;
  if (!EXTRACURRICULAR_TYPES.has(raw)) {
    throw new AppError(`Invalid type: ${raw}`, 400, "BAD_REQUEST");
  }
  return raw as ExtracurricularTypeDto;
}

function parseCost(raw: string | undefined): CostOptionDto | undefined {
  if (!raw || raw === "Any cost") return undefined;
  if (!COST_OPTIONS.has(raw)) {
    throw new AppError(`Invalid cost: ${raw}`, 400, "BAD_REQUEST");
  }
  return raw as CostOptionDto;
}

function parseGrade(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 9 || n > 12) {
    throw new AppError(`Invalid grade: ${raw}`, 400, "BAD_REQUEST");
  }
  return n;
}

function parseSort(raw: string | undefined): ListingsSort {
  if (raw === undefined || raw === "") return "deadline";
  if (raw === "deadline" || raw === "alpha" || raw === "recent") return raw;
  throw new AppError(`Invalid sort: ${raw}`, 400, "BAD_REQUEST");
}

function parseLimit(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 100;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 500) {
    throw new AppError("limit must be an integer 1–500", 400, "BAD_REQUEST");
  }
  return n;
}

function parseOffset(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 0;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new AppError("offset must be a non-negative integer", 400, "BAD_REQUEST");
  }
  return n;
}
