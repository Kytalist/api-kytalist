import { beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";

const findByEmail = vi.fn();
const findByConfirmToken = vi.fn();
const findByUnsubToken = vi.fn();
const create = vi.fn();
const update = vi.fn();

vi.mock("../src/repositories/subscriberRepository.js", () => ({
  SubscriberRepository: class {
    findByEmail = findByEmail;
    findByConfirmToken = findByConfirmToken;
    findByUnsubToken = findByUnsubToken;
    create = create;
    update = update;
    findManyWithCount = vi.fn();
    findConfirmedEmails = vi.fn().mockResolvedValue([]);
  },
}));

vi.mock("../src/infrastructure/email.js", async () => {
  const real =
    await vi.importActual<typeof import("../src/infrastructure/email.js")>(
      "../src/infrastructure/email.js",
    );
  return {
    ...real,
    sendEmail: vi.fn().mockResolvedValue(true),
  };
});

vi.mock("../src/infrastructure/prisma.js", () => ({
  getPrisma: () => ({}),
  disconnectPrisma: vi.fn(),
}));

let createApp: typeof import("../src/presentation/createApp.js").createApp;

beforeAll(async () => {
  ({ createApp } = await import("../src/presentation/createApp.js"));
});

describe("POST /api/v1/newsletter/subscribe", () => {
  it("creates a pending subscription for new email", async () => {
    findByEmail.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({
      id: "s1",
      email: "a@b.co",
      status: "pending",
      confirmToken: "ct",
      unsubToken: "ut",
      confirmedAt: null,
      unsubscribedAt: null,
      createdAt: new Date(),
    });
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "a@b.co" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("pending");
  });

  it("rejects invalid email", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("returns already-subscribed for confirmed email", async () => {
    findByEmail.mockResolvedValueOnce({
      id: "s1",
      email: "a@b.co",
      status: "confirmed",
      confirmToken: null,
      unsubToken: "ut",
      confirmedAt: new Date(),
      unsubscribedAt: null,
      createdAt: new Date(),
    });
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "a@b.co" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("already-subscribed");
  });
});

describe("GET /api/v1/newsletter/confirm", () => {
  it("rejects invalid token with 400", async () => {
    findByConfirmToken.mockResolvedValueOnce(null);
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/newsletter/confirm")
      .query({ token: "bogus" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
  });

  it("confirms a pending subscriber", async () => {
    findByConfirmToken.mockResolvedValueOnce({
      id: "s1",
      email: "a@b.co",
      status: "pending",
      confirmToken: "ct",
      unsubToken: "ut",
      confirmedAt: null,
      unsubscribedAt: null,
      createdAt: new Date(),
    });
    update.mockResolvedValueOnce({});
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/newsletter/confirm")
      .query({ token: "ct" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("confirmed");
  });
});
