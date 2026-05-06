import type { AuditLog, Prisma } from "../../generated/prisma/client.js";
import { Prisma as PrismaNS } from "../../generated/prisma/client.js";
import { getPrisma } from "../infrastructure/prisma.js";

export type AuditCreateArgs = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
};

export class AuditRepository {
  async create(args: AuditCreateArgs): Promise<AuditLog> {
    return getPrisma().auditLog.create({
      data: {
        actorId: args.actorId ?? null,
        action: args.action,
        entityType: args.entityType,
        entityId: args.entityId,
        before: args.before === undefined
          ? PrismaNS.JsonNull
          : (args.before as Prisma.InputJsonValue),
        after: args.after === undefined
          ? PrismaNS.JsonNull
          : (args.after as Prisma.InputJsonValue),
      },
    });
  }

  async findManyWithCount(args: {
    where: Prisma.AuditLogWhereInput;
    take: number;
    skip: number;
  }): Promise<{ rows: AuditLog[]; total: number }> {
    const prisma = getPrisma();
    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: args.where,
        orderBy: { createdAt: "desc" },
        take: args.take,
        skip: args.skip,
      }),
      prisma.auditLog.count({ where: args.where }),
    ]);
    return { rows, total };
  }
}
