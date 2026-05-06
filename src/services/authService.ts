import { AppError } from "../domain/AppError.js";
import { toUserJson, type UserJson } from "../domain/user.dto.js";
import type { SupabaseJwtPayload } from "../infrastructure/supabaseAuth.js";
import { UserRepository } from "../repositories/userRepository.js";

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  /** Lazy-upserts a local User row from the verified Supabase JWT. */
  async syncFromAuthToken(payload: SupabaseJwtPayload) {
    if (!payload.email) {
      throw new AppError(
        "Token has no email claim",
        401,
        "INVALID_TOKEN",
      );
    }
    const meta = payload.user_metadata ?? {};
    const name =
      typeof meta["name"] === "string"
        ? (meta["name"] as string)
        : typeof meta["full_name"] === "string"
          ? (meta["full_name"] as string)
          : null;
    return this.users.upsertFromAuth({
      id: payload.sub,
      email: payload.email,
      emailVerified: typeof meta["email_verified"] === "boolean"
        ? (meta["email_verified"] as boolean)
        : true,
      name,
    });
  }

  async getMe(userId: string): Promise<UserJson> {
    const u = await this.users.findById(userId);
    if (!u) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }
    return toUserJson(u);
  }
}
