import type { WaitlistEntry } from "../../generated/prisma/client.js";
import { AppError } from "../domain/AppError.js";
import type { WaitlistRepository } from "../repositories/waitlistRepository.js";

export class WaitlistService {
  constructor(private readonly repo: WaitlistRepository) {}

  async join(email: string): Promise<{ status: string }> {
    const normalized = email.trim().toLowerCase();

    const existing = await this.repo.findByEmail(normalized);
    if (existing) {
      return { status: "already-joined" };
    }

    await this.repo.create({ email: normalized });
    return { status: "joined" };
  }

  async count(): Promise<number> {
    return this.repo.count();
  }
}
