import type { Listing, Prisma } from "../../generated/prisma/client.js";
import { ExtracurricularType } from "../../generated/prisma/enums.js";
import { AppError } from "../domain/AppError.js";
import type {
  ListingJson,
  ListListingsQuery,
  ListingsSort,
} from "../domain/listing.dto.js";
import { ListingRepository } from "../repositories/listingRepository.js";

export type ListResult = {
  items: ListingJson[];
  total: number;
};

/**
 * Business logic: filters, sorting, DTO mapping (tier 2).
 */
export class ListingService {
  constructor(private readonly repo: ListingRepository) {}

  async listFeatured(): Promise<ListingJson[]> {
    const rows = await this.repo.findFeatured();
    return rows.map((r) => toListingJson(r));
  }

  async listTrending(): Promise<ListingJson[]> {
    const rows = await this.repo.findTrending();
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

  async list(query: ListListingsQuery): Promise<ListResult> {
    const where = buildWhere(query);
    const orderBy = sortToOrderBy(query.sort);
    const { rows, total } = await this.repo.findManyWithCount({
      where,
      take: query.limit,
      skip: query.offset,
      orderBy,
    });
    return { items: rows.map(toListingJson), total };
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

function sortToOrderBy(
  sort: ListingsSort,
):
  | Prisma.ListingOrderByWithRelationInput
  | Prisma.ListingOrderByWithRelationInput[] {
  if (sort === "alpha") return { title: "asc" };
  if (sort === "recent") return { createdAt: "desc" };
  return [
    { deadlineAt: { sort: "asc", nulls: "last" } },
    { deadline: { sort: "asc", nulls: "last" } },
  ];
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
