import type { User } from "../../generated/prisma/client.js";
import type { UserRole } from "../../generated/prisma/enums.js";

export type UserJson = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export function toUserJson(u: User): UserJson {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}
