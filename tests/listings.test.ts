import { beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";

const findManyWithCount = vi.fn();
const findFeatured = vi.fn();
const findTrending = vi.fn();
const findById = vi.fn();
const groupByCategory = vi.fn();
const groupByStatus = vi.fn();

vi.mock("../src/repositories/listingRepository.js", () => ({
  ListingRepository: class {
    findManyWithCount = findManyWithCount;
    findFeatured = findFeatured;
    findTrending = findTrending;
    findById = findById;
    findMany = vi.fn();
    create = vi.fn();
    update = vi.fn();
    delete = vi.fn();
    groupByCategory = groupByCategory;
    groupByStatus = groupByStatus;
  },
}));

vi.mock("../src/infrastructure/prisma.js", () => ({
  getPrisma: () => ({
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  }),
  disconnectPrisma: vi.fn(),
}));

let createApp: typeof import("../src/presentation/createApp.js").createApp;

beforeAll(async () => {
  ({ createApp } = await import("../src/presentation/createApp.js"));
});

describe("GET /api/v1/listings", () => {
  it("returns envelope with data + meta", async () => {
    findManyWithCount.mockResolvedValue({
      rows: [
        {
          id: "l1",
          title: "Test",
          org: "Acme",
          location: "NYC",
          region: "Northeast",
          description: "Cool",
          image: "/x.svg",
          category: "activity",
          badge: "New",
          footer: "Soon",
          deadline: null,
          type: null,
          cost: null,
          grades: [],
          tags: [],
          keywords: "",
          deadlineAt: null,
          featuredOrder: null,
          trendingOrder: null,
          status: "published",
          publishedAt: null,
          authorId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
    });

    const app = createApp();
    const res = await request(app).get("/api/v1/listings?limit=20");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ total: 1, limit: 20, offset: 0 });
  });

  it("rejects bad sort with 400", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/listings?sort=oldest");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("rejects out-of-range grade with 400", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/listings?grade=8");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/listings/featured", () => {
  it("returns featured array", async () => {
    findFeatured.mockResolvedValue([]);
    const app = createApp();
    const res = await request(app).get("/api/v1/listings/featured");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("GET /api/v1/listings/trending", () => {
  it("returns trending array", async () => {
    findTrending.mockResolvedValue([]);
    const app = createApp();
    const res = await request(app).get("/api/v1/listings/trending");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("GET /api/v1/meta/counts", () => {
  it("returns category counts", async () => {
    groupByCategory.mockResolvedValue([
      { category: "activity", count: 12 },
      { category: "camp", count: 5 },
    ]);
    const app = createApp();
    const res = await request(app).get("/api/v1/meta/counts");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ activity: 12, camp: 5 });
  });
});
