import type { Application } from "../../generated/prisma/client.js";
import { AppError } from "../domain/AppError.js";
import { ApplicationRepository } from "../repositories/applicationRepository.js";

export type ApplicationJson = {
  id: string;
  userId: string;
  listingId: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateApplicationInput = {
  listingId: string;
  status?: string | undefined;
  notes?: string | null | undefined;
};

export type UpdateApplicationInput = {
  status?: string | undefined;
  notes?: string | null | undefined;
};

const VALID_STATUSES = new Set(["draft", "submitted", "accepted", "rejected"]);

function toJson(a: Application): ApplicationJson {
  return {
    id: a.id,
    userId: a.userId,
    listingId: a.listingId,
    status: a.status,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export class ApplicationService {
  constructor(private readonly repo: ApplicationRepository) {}

  async list(userId: string): Promise<ApplicationJson[]> {
    const rows = await this.repo.findForUser(userId);
    return rows.map(toJson);
  }

  async create(
    userId: string,
    body: CreateApplicationInput,
  ): Promise<ApplicationJson> {
    if (body.status && !VALID_STATUSES.has(body.status)) {
      throw new AppError(`Invalid status: ${body.status}`, 400, "BAD_REQUEST");
    }
    const row = await this.repo.create({
      status: body.status ?? "draft",
      notes: body.notes ?? null,
      user: { connect: { id: userId } },
      listing: { connect: { id: body.listingId } },
    });
    return toJson(row);
  }

  async update(
    userId: string,
    id: string,
    body: UpdateApplicationInput,
  ): Promise<ApplicationJson> {
    const before = await this.repo.findById(id);
    if (!before || before.userId !== userId) {
      throw new AppError("Application not found", 404, "NOT_FOUND");
    }
    if (body.status && !VALID_STATUSES.has(body.status)) {
      throw new AppError(`Invalid status: ${body.status}`, 400, "BAD_REQUEST");
    }
    const data: Parameters<ApplicationRepository["update"]>[1] = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;
    const after = await this.repo.update(id, data);
    return toJson(after);
  }

  async delete(userId: string, id: string): Promise<void> {
    const before = await this.repo.findById(id);
    if (!before || before.userId !== userId) {
      throw new AppError("Application not found", 404, "NOT_FOUND");
    }
    await this.repo.delete(id);
  }
}
