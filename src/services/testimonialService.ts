import type { Testimonial } from "../../generated/prisma/client.js";
import { AppError } from "../domain/AppError.js";
import { TestimonialRepository } from "../repositories/testimonialRepository.js";

export type TestimonialJson = {
  id: string;
  name: string;
  role: string | null;
  quote: string;
  avatar: string | null;
  published: boolean;
  order: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTestimonialBody = {
  name: string;
  role?: string | null | undefined;
  quote: string;
  avatar?: string | null | undefined;
  published?: boolean | undefined;
  order?: number | null | undefined;
};

export type UpdateTestimonialBody = {
  name?: string | undefined;
  role?: string | null | undefined;
  quote?: string | undefined;
  avatar?: string | null | undefined;
  published?: boolean | undefined;
  order?: number | null | undefined;
};

function toJson(t: Testimonial): TestimonialJson {
  return {
    id: t.id,
    name: t.name,
    role: t.role,
    quote: t.quote,
    avatar: t.avatar,
    published: t.published,
    order: t.order,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export class TestimonialService {
  constructor(private readonly repo: TestimonialRepository) {}

  async listPublic(): Promise<TestimonialJson[]> {
    const rows = await this.repo.findPublished();
    return rows.map(toJson);
  }

  async listAdmin(): Promise<TestimonialJson[]> {
    const rows = await this.repo.findManyForAdmin();
    return rows.map(toJson);
  }

  async create(body: CreateTestimonialBody): Promise<TestimonialJson> {
    const row = await this.repo.create({
      name: body.name,
      role: body.role ?? null,
      quote: body.quote,
      avatar: body.avatar ?? null,
      published: body.published ?? false,
      order: body.order ?? null,
    });
    return toJson(row);
  }

  async update(
    id: string,
    body: UpdateTestimonialBody,
  ): Promise<TestimonialJson> {
    const before = await this.repo.findById(id);
    if (!before) {
      throw new AppError("Testimonial not found", 404, "NOT_FOUND");
    }
    const data: Parameters<TestimonialRepository["update"]>[1] = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.role !== undefined) data.role = body.role;
    if (body.quote !== undefined) data.quote = body.quote;
    if (body.avatar !== undefined) data.avatar = body.avatar;
    if (body.published !== undefined) data.published = body.published;
    if (body.order !== undefined) data.order = body.order;
    const after = await this.repo.update(id, data);
    return toJson(after);
  }

  async delete(id: string): Promise<void> {
    const before = await this.repo.findById(id);
    if (!before) {
      throw new AppError("Testimonial not found", 404, "NOT_FOUND");
    }
    await this.repo.delete(id);
  }
}
