import type { Prisma, User } from "../../generated/prisma/client.js";
import type { UserRole } from "../../generated/prisma/enums.js";
import { getPrisma } from "../infrastructure/prisma.js";

export type UpsertFromAuthArgs = {
  id: string;
  email: string;
  emailVerified?: boolean;
  name?: string | null;
};

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return getPrisma().user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return getPrisma().user.findUnique({ where: { email } });
  }

  async upsertFromAuth(args: UpsertFromAuthArgs): Promise<User> {
    return getPrisma().user.upsert({
      where: { id: args.id },
      create: {
        id: args.id,
        email: args.email,
        name: args.name ?? null,
        emailVerified: args.emailVerified ?? false,
      },
      update: {
        email: args.email,
        ...(args.emailVerified !== undefined
          ? { emailVerified: args.emailVerified }
          : {}),
        ...(args.name !== undefined ? { name: args.name } : {}),
      },
    });
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    return getPrisma().user.update({ where: { id }, data: { role } });
  }

  async findManyWithCount(args: {
    where: Prisma.UserWhereInput;
    take: number;
    skip: number;
    orderBy:
      | Prisma.UserOrderByWithRelationInput
      | Prisma.UserOrderByWithRelationInput[];
  }): Promise<{ rows: User[]; total: number }> {
    const prisma = getPrisma();
    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where: args.where,
        orderBy: args.orderBy,
        take: args.take,
        skip: args.skip,
      }),
      prisma.user.count({ where: args.where }),
    ]);
    return { rows, total };
  }

  async delete(id: string): Promise<User> {
    return getPrisma().user.delete({ where: { id } });
  }

  async groupByRole(): Promise<Array<{ role: UserRole; count: number }>> {
    const rows = await getPrisma().user.groupBy({
      by: ["role"],
      _count: { _all: true },
    });
    return rows.map((r) => ({ role: r.role, count: r._count._all }));
  }
}
