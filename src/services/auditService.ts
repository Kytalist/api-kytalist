import type { AuditLog } from "../../generated/prisma/client.js";
import {
  AuditRepository,
  type AuditCreateArgs,
} from "../repositories/auditRepository.js";

export type AuditLogJson = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  createdAt: string;
};

export type ListAuditQuery = {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
};

export class AuditService {
  constructor(private readonly repo: AuditRepository) {}

  async record(args: AuditCreateArgs): Promise<void> {
    await this.repo.create(args);
  }

  async list(q: ListAuditQuery): Promise<{ items: AuditLogJson[]; total: number }> {
    const where: Parameters<AuditRepository["findManyWithCount"]>[0]["where"] = {};
    if (q.entityType) where.entityType = q.entityType;
    if (q.entityId) where.entityId = q.entityId;
    if (q.actorId) where.actorId = q.actorId;
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = q.from;
      if (q.to) where.createdAt.lte = q.to;
    }
    const { rows, total } = await this.repo.findManyWithCount({
      where,
      take: q.limit,
      skip: q.offset,
    });
    return { items: rows.map(toAuditJson), total };
  }
}

export function toAuditJson(row: AuditLog): AuditLogJson {
  return {
    id: row.id,
    actorId: row.actorId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    before: row.before,
    after: row.after,
    createdAt: row.createdAt.toISOString(),
  };
}
