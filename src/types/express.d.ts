import type { UserRole } from "../../generated/prisma/enums.js";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}
