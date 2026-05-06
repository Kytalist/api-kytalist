import type { Prisma, Subscriber } from "../../generated/prisma/client.js";
import { getPrisma } from "../infrastructure/prisma.js";

export class SubscriberRepository {
  async findByEmail(email: string): Promise<Subscriber | null> {
    return getPrisma().subscriber.findUnique({ where: { email } });
  }

  async findByConfirmToken(token: string): Promise<Subscriber | null> {
    return getPrisma().subscriber.findUnique({ where: { confirmToken: token } });
  }

  async findByUnsubToken(token: string): Promise<Subscriber | null> {
    return getPrisma().subscriber.findUnique({ where: { unsubToken: token } });
  }

  async create(data: Prisma.SubscriberCreateInput): Promise<Subscriber> {
    return getPrisma().subscriber.create({ data });
  }

  async update(
    id: string,
    data: Prisma.SubscriberUpdateInput,
  ): Promise<Subscriber> {
    return getPrisma().subscriber.update({ where: { id }, data });
  }

  async findManyWithCount(args: {
    where: Prisma.SubscriberWhereInput;
    take: number;
    skip: number;
  }): Promise<{ rows: Subscriber[]; total: number }> {
    const prisma = getPrisma();
    const [rows, total] = await Promise.all([
      prisma.subscriber.findMany({
        where: args.where,
        orderBy: { createdAt: "desc" },
        take: args.take,
        skip: args.skip,
      }),
      prisma.subscriber.count({ where: args.where }),
    ]);
    return { rows, total };
  }

  async findConfirmedEmails(): Promise<string[]> {
    const rows = await getPrisma().subscriber.findMany({
      where: { status: "confirmed" },
      select: { email: true },
    });
    return rows.map((r) => r.email);
  }
}
