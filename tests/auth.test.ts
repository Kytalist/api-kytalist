import { beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";

const verifyAccessToken = vi.fn();
const upsertFromAuth = vi.fn();
const findById = vi.fn();

vi.mock("../src/infrastructure/supabaseAuth.js", () => ({
  verifyAccessToken: (token: string) => verifyAccessToken(token),
}));

vi.mock("../src/repositories/userRepository.js", () => ({
  UserRepository: class {
    upsertFromAuth = upsertFromAuth;
    findById = findById;
    findByEmail = vi.fn();
    updateRole = vi.fn();
    findManyWithCount = vi.fn();
    delete = vi.fn();
    groupByRole = vi.fn().mockResolvedValue([]);
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

describe("GET /api/v1/auth/me", () => {
  it("401 without bearer", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("401 with invalid token", async () => {
    const { AppError } = await import("../src/domain/AppError.js");
    verifyAccessToken.mockRejectedValueOnce(
      new AppError("Invalid token", 401, "INVALID_TOKEN"),
    );
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer bad-token");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
  });

  it("200 with valid token", async () => {
    verifyAccessToken.mockResolvedValueOnce({
      sub: "user-1",
      email: "u@x.com",
      user_metadata: { name: "Test", email_verified: true },
    });
    const now = new Date();
    upsertFromAuth.mockResolvedValueOnce({
      id: "user-1",
      email: "u@x.com",
      name: "Test",
      role: "user",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    findById.mockResolvedValueOnce({
      id: "user-1",
      email: "u@x.com",
      name: "Test",
      role: "user",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer good-token");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("user-1");
    expect(res.body.data.role).toBe("user");
  });
});
