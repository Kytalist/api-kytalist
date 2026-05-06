import type { Application, Prisma } from "../../generated/prisma/client.js";
import { getPrisma } from "../infrastructure/prisma.js";

export class ApplicationRepository {
  async findForUser(userId: string): Promise<Application[]> {
    return getPrisma().application.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findById(id: string): Promise<Application | null> {
    return getPrisma().application.findUnique({ where: { id } });
  }

  async create(data: Prisma.ApplicationCreateInput): Promise<Application> {
    return getPrisma().application.create({ data });
  }

  async update(
    id: string,
    data: Prisma.ApplicationUpdateInput,
  ): Promise<Application> {
    return getPrisma().application.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Application> {
    return getPrisma().application.delete({ where: { id } });
  }
}
