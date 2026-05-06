import type { Prisma } from "../../generated/prisma/client.js";
import type { UserRole } from "../../generated/prisma/enums.js";
import { AppError } from "../domain/AppError.js";
import type {
  AdminListUsersQuery,
  UpdateUserBody,
} from "../domain/schemas/userAdmin.js";
import { toUserJson, type UserJson } from "../domain/user.dto.js";
import { getSupabaseAdmin } from "../infrastructure/supabaseClient.js";
import { UserRepository } from "../repositories/userRepository.js";
import type { AuditService } from "./auditService.js";

export type UserListResult = {
  items: UserJson[];
  total: number;
};

export class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly audit: AuditService,
  ) {}

  async list(q: AdminListUsersQuery): Promise<UserListResult> {
    const where: Prisma.UserWhereInput = {};
    if (q.role) where.role = q.role;
    if (q.q) {
      where.OR = [
        { email: { contains: q.q, mode: "insensitive" } },
        { name: { contains: q.q, mode: "insensitive" } },
      ];
    }
    const { rows, total } = await this.users.findManyWithCount({
      where,
      take: q.limit,
      skip: q.offset,
      orderBy: { createdAt: "desc" },
    });
    return { items: rows.map(toUserJson), total };
  }

  async update(
    actorId: string,
    id: string,
    body: UpdateUserBody,
  ): Promise<UserJson> {
    const before = await this.users.findById(id);
    if (!before) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }
    if (body.role === undefined) {
      return toUserJson(before);
    }
    const after = await this.users.updateRole(id, body.role as UserRole);
    await this.audit.record({
      actorId,
      action: "user.update",
      entityType: "User",
      entityId: id,
      before: { role: before.role },
      after: { role: after.role },
    });
    return toUserJson(after);
  }

  async delete(actorId: string, id: string): Promise<void> {
    if (id === actorId) {
      throw new AppError("You cannot delete yourself", 400, "BAD_REQUEST");
    }
    const before = await this.users.findById(id);
    if (!before) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }
    await this.users.delete(id);
    try {
      const supa = getSupabaseAdmin();
      await supa.auth.admin.deleteUser(id);
    } catch (err) {
      // Non-fatal: local row already removed. Auth row deletion logged for retry.
      await this.audit.record({
        actorId,
        action: "user.supabase_delete_failed",
        entityType: "User",
        entityId: id,
        after: { error: err instanceof Error ? err.message : String(err) },
      });
    }
    await this.audit.record({
      actorId,
      action: "user.delete",
      entityType: "User",
      entityId: id,
      before: { email: before.email, role: before.role },
    });
  }
}
