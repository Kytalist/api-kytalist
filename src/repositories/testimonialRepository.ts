import type { Prisma, Testimonial } from "../../generated/prisma/client.js";
import { getPrisma } from "../infrastructure/prisma.js";

export class TestimonialRepository {
  async findPublished(): Promise<Testimonial[]> {
    return getPrisma().testimonial.findMany({
      where: { published: true },
      orderBy: [{ order: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    });
  }

  async findManyForAdmin(): Promise<Testimonial[]> {
    return getPrisma().testimonial.findMany({
      orderBy: [{ order: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    });
  }

  async findById(id: string): Promise<Testimonial | null> {
    return getPrisma().testimonial.findUnique({ where: { id } });
  }

  async create(data: Prisma.TestimonialCreateInput): Promise<Testimonial> {
    return getPrisma().testimonial.create({ data });
  }

  async update(
    id: string,
    data: Prisma.TestimonialUpdateInput,
  ): Promise<Testimonial> {
    return getPrisma().testimonial.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Testimonial> {
    return getPrisma().testimonial.delete({ where: { id } });
  }
}
