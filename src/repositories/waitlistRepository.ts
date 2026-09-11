import type { Prisma, WaitlistEntry } from "../../generated/prisma/client.js";
import { getPrisma } from "../infrastructure/prisma.js";

export class WaitlistRepository {
  async findByEmail(email: string): Promise<WaitlistEntry | null> {
    return getPrisma().waitlistEntry.findUnique({ where: { email } });
  }

  async create(data: Prisma.WaitlistEntryCreateInput): Promise<WaitlistEntry> {
    return getPrisma().waitlistEntry.create({ data });
  }

  async count(): Promise<number> {
    return getPrisma().waitlistEntry.count();
  }
}
