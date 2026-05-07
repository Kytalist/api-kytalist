import type { Listing, Prisma } from "../../generated/prisma/client.js";
import { ListingStatus } from "../../generated/prisma/enums.js";
import { AppError } from "../domain/AppError.js";
import type { AdminListingJson } from "../domain/listing.dto.js";
import type {
  AdminListListingsQuery,
  CreateListingBody,
  UpdateListingBody,
} from "../domain/schemas/listingAdmin.js";
import { ListingRepository } from "../repositories/listingRepository.js";
import { toAdminListingJson } from "./listingService.js";
import type { AuditService } from "./auditService.js";

export type AdminListResult = {
  items: AdminListingJson[];
  total: number;
};

function keywordsFrom(tags: string[] | undefined): string {
  return (tags ?? []).join(" ").trim();
}

export class AdminListingService {
  constructor(
    private readonly repo: ListingRepository,
    private readonly audit: AuditService,
  ) {}

  async list(q: AdminListListingsQuery): Promise<AdminListResult> {
    const where: Prisma.ListingWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.category) where.category = q.category;
    if (q.q) {
      where.OR = [
        { title: { contains: q.q, mode: "insensitive" } },
        { org: { contains: q.q, mode: "insensitive" } },
        { keywords: { contains: q.q, mode: "insensitive" } },
      ];
    }
    const { rows, total } = await this.repo.findManyWithCount(
      {
        where,
        orderBy: { updatedAt: "desc" },
        take: q.limit,
        skip: q.offset,
      },
      { includeUnpublished: true },
    );
    return { items: rows.map(toAdminListingJson), total };
  }

  async getById(id: string): Promise<AdminListingJson> {
    const row = await this.repo.findById(id, { includeUnpublished: true });
    if (!row) {
      throw new AppError(`Listing not found: ${id}`, 404, "NOT_FOUND");
    }
    return toAdminListingJson(row);
  }

  async create(actorId: string, body: CreateListingBody): Promise<AdminListingJson> {
    const data: Prisma.ListingCreateInput = {
      id: body.id,
      title: body.title,
      org: body.org,
      location: body.location,
      region: body.region,
      description: body.description,
      image: body.image,
      category: body.category,
      badge: body.badge,
      footer: body.footer,
      deadline: body.deadline ?? null,
      type: body.type ?? null,
      cost: body.cost ?? null,
      grades: body.grades,
      tags: body.tags,
      keywords: keywordsFrom(body.tags),
      deadlineAt: body.deadlineAt ? new Date(body.deadlineAt) : null,
      featuredOrder: body.featuredOrder ?? null,
      trendingOrder: body.trendingOrder ?? null,
      status: body.status,
      publishedAt: body.status === ListingStatus.published ? new Date() : null,
      author: { connect: { id: actorId } },
    };
    const row = await this.repo.create(data);
    await this.audit.record({
      actorId,
      action: "listing.create",
      entityType: "Listing",
      entityId: row.id,
      after: serializeListing(row),
    });
    return toAdminListingJson(row);
  }

  async update(
    actorId: string,
    id: string,
    body: UpdateListingBody,
  ): Promise<AdminListingJson> {
    const before = await this.repo.findById(id, { includeUnpublished: true });
    if (!before) {
      throw new AppError(`Listing not found: ${id}`, 404, "NOT_FOUND");
    }

    const data: Prisma.ListingUpdateInput = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.org !== undefined) data.org = body.org;
    if (body.location !== undefined) data.location = body.location;
    if (body.region !== undefined) data.region = body.region;
    if (body.description !== undefined) data.description = body.description;
    if (body.image !== undefined) data.image = body.image;
    if (body.category !== undefined) data.category = body.category;
    if (body.badge !== undefined) data.badge = body.badge;
    if (body.footer !== undefined) data.footer = body.footer;
    if (body.deadline !== undefined) data.deadline = body.deadline;
    if (body.type !== undefined) data.type = body.type;
    if (body.cost !== undefined) data.cost = body.cost;
    if (body.grades !== undefined) {
      data.grades = body.grades;
      data.keywords = keywordsFrom(body.tags ?? before.tags);
    }
    if (body.tags !== undefined) {
      data.tags = body.tags;
      data.keywords = keywordsFrom(body.tags);
    }
    if (body.deadlineAt !== undefined) {
      data.deadlineAt = body.deadlineAt ? new Date(body.deadlineAt) : null;
    }
    if (body.featuredOrder !== undefined) data.featuredOrder = body.featuredOrder;
    if (body.trendingOrder !== undefined) data.trendingOrder = body.trendingOrder;
    if (body.status !== undefined) {
      data.status = body.status;
      if (
        body.status === ListingStatus.published &&
        before.status !== ListingStatus.published
      ) {
        data.publishedAt = new Date();
      }
    }

    const after = await this.repo.update(id, data);
    await this.audit.record({
      actorId,
      action: "listing.update",
      entityType: "Listing",
      entityId: id,
      before: serializeListing(before),
      after: serializeListing(after),
    });
    return toAdminListingJson(after);
  }

  async delete(actorId: string, id: string): Promise<void> {
    const before = await this.repo.findById(id, { includeUnpublished: true });
    if (!before) {
      throw new AppError(`Listing not found: ${id}`, 404, "NOT_FOUND");
    }
    await this.repo.delete(id);
    await this.audit.record({
      actorId,
      action: "listing.delete",
      entityType: "Listing",
      entityId: id,
      before: serializeListing(before),
    });
  }

  async setStatus(
    actorId: string,
    id: string,
    status: ListingStatus,
  ): Promise<AdminListingJson> {
    const before = await this.repo.findById(id, { includeUnpublished: true });
    if (!before) {
      throw new AppError(`Listing not found: ${id}`, 404, "NOT_FOUND");
    }
    const data: Prisma.ListingUpdateInput = { status };
    if (
      status === ListingStatus.published &&
      before.status !== ListingStatus.published
    ) {
      data.publishedAt = new Date();
    }
    const after = await this.repo.update(id, data);
    await this.audit.record({
      actorId,
      action: `listing.${status}`,
      entityType: "Listing",
      entityId: id,
      before: { status: before.status },
      after: { status },
    });
    return toAdminListingJson(after);
  }

  async setOrder(
    actorId: string,
    id: string,
    field: "featuredOrder" | "trendingOrder",
    value: number | null,
  ): Promise<AdminListingJson> {
    const before = await this.repo.findById(id, { includeUnpublished: true });
    if (!before) {
      throw new AppError(`Listing not found: ${id}`, 404, "NOT_FOUND");
    }
    const after = await this.repo.update(id, { [field]: value });
    await this.audit.record({
      actorId,
      action: `listing.${field}`,
      entityType: "Listing",
      entityId: id,
      before: { [field]: before[field] },
      after: { [field]: value },
    });
    return toAdminListingJson(after);
  }
}

function serializeListing(l: Listing): Record<string, unknown> {
  return {
    ...l,
    deadlineAt: l.deadlineAt?.toISOString() ?? null,
    publishedAt: l.publishedAt?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}
