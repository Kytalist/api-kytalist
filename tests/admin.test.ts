import { beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";

const verifyAccessToken = vi.fn();
const upsertFromAuth = vi.fn();
const groupByRole = vi.fn().mockResolvedValue([]);
const groupByCategory = vi.fn().mockResolvedValue([]);
const groupByStatus = vi.fn().mockResolvedValue([]);

vi.mock("../src/infrastructure/supabaseAuth.js", () => ({
  verifyAccessToken: (token: string) => verifyAccessToken(token),
}));

vi.mock("../src/repositories/userRepository.js", () => ({
  UserRepository: class {
    upsertFromAuth = upsertFromAuth;
    findById = vi.fn();
    findByEmail = vi.fn();
    updateRole = vi.fn();
    findManyWithCount = vi.fn();
    delete = vi.fn();
    groupByRole = groupByRole;
  },
}));

vi.mock("../src/repositories/listingRepository.js", () => ({
  ListingRepository: class {
    findManyWithCount = vi.fn();
    findFeatured = vi.fn();
    findTrending = vi.fn();
    findById = vi.fn();
    findMany = vi.fn();
    create = vi.fn();
    update = vi.fn();
    delete = vi.fn();
    groupByCategory = groupByCategory;
    groupByStatus = groupByStatus;
  },
}));

vi.mock("../src/infrastructure/prisma.js", () => ({
  getPrisma: () => ({}),
  disconnectPrisma: vi.fn(),
}));

let createApp: typeof import("../src/presentation/createApp.js").createApp;

beforeAll(async () => {
  ({ createApp } = await import("../src/presentation/createApp.js"));
});

describe("Admin RBAC matrix", () => {
  it("anonymous → 401", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/admin/stats");
    expect(res.status).toBe(401);
  });

  it("regular user → 403", async () => {
    verifyAccessToken.mockResolvedValueOnce({
      sub: "u1",
      email: "u@x.com",
      user_metadata: {},
    });
    upsertFromAuth.mockResolvedValueOnce({
      id: "u1",
      email: "u@x.com",
      name: null,
      role: "user",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", "Bearer t");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("admin user → 200", async () => {
    verifyAccessToken.mockResolvedValueOnce({
      sub: "a1",
      email: "a@x.com",
      user_metadata: {},
    });
    upsertFromAuth.mockResolvedValueOnce({
      id: "a1",
      email: "a@x.com",
      name: null,
      role: "admin",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", "Bearer t");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("listings");
    expect(res.body.data).toHaveProperty("users");
  });
});
