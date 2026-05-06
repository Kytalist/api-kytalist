import { type Prisma, type Listing } from "../../generated/prisma/client.js";
import { ListingStatus } from "../../generated/prisma/enums.js";
import { getPrisma } from "../infrastructure/prisma.js";

export type FindManyArgs = {
  where: Prisma.ListingWhereInput;
  take: number;
  skip: number;
  orderBy:
    | Prisma.ListingOrderByWithRelationInput
    | Prisma.ListingOrderByWithRelationInput[];
};

export type RepoOptions = {
  /** Admin reads must pass `true`; defaults to false (published only). */
  includeUnpublished?: boolean;
};

/**
 * Data access layer — Prisma queries only (tier 3).
 */
export class ListingRepository {
  async findManyWithCount(
    args: FindManyArgs,
    options: RepoOptions = {},
  ): Promise<{ rows: Listing[]; total: number }> {
    const where = applyStatusFilter(args.where, options.includeUnpublished);
    const prisma = getPrisma();
    const [rows, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: args.orderBy,
        take: args.take,
        skip: args.skip,
      }),
      prisma.listing.count({ where }),
    ]);
    return { rows, total };
  }

  async findById(
    id: string,
    options: RepoOptions = {},
  ): Promise<Listing | null> {
    const where = applyStatusFilter({ id }, options.includeUnpublished);
    return getPrisma().listing.findFirst({ where });
  }

  async findFeatured(options: RepoOptions = {}): Promise<Listing[]> {
    const where = applyStatusFilter(
      { featuredOrder: { not: null } },
      options.includeUnpublished,
    );
    return getPrisma().listing.findMany({
      where,
      orderBy: { featuredOrder: "asc" },
    });
  }

  async findTrending(options: RepoOptions = {}): Promise<Listing[]> {
    const where = applyStatusFilter(
      { trendingOrder: { not: null } },
      options.includeUnpublished,
    );
    return getPrisma().listing.findMany({
      where,
      orderBy: { trendingOrder: "asc" },
    });
  }

  async create(data: Prisma.ListingCreateInput): Promise<Listing> {
    return getPrisma().listing.create({ data });
  }

  async update(id: string, data: Prisma.ListingUpdateInput): Promise<Listing> {
    return getPrisma().listing.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Listing> {
    return getPrisma().listing.delete({ where: { id } });
  }

  async groupByCategory(): Promise<Array<{ category: string; count: number }>> {
    const rows = await getPrisma().listing.groupBy({
      by: ["category"],
      where: { status: ListingStatus.published },
      _count: { _all: true },
    });
    return rows.map((r) => ({ category: r.category, count: r._count._all }));
  }

  async groupByStatus(): Promise<Array<{ status: ListingStatus; count: number }>> {
    const rows = await getPrisma().listing.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    return rows.map((r) => ({ status: r.status, count: r._count._all }));
  }
}

function applyStatusFilter(
  where: Prisma.ListingWhereInput,
  includeUnpublished: boolean | undefined,
): Prisma.ListingWhereInput {
  if (includeUnpublished) return where;
  return { AND: [where, { status: ListingStatus.published }] };
}
