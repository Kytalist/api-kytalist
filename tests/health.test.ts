import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/presentation/createApp.js";

describe("GET /health/live", () => {
  it("returns ok", async () => {
    const app = createApp();
    const res = await request(app).get("/health/live");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
  });
});

describe("GET /health (legacy)", () => {
  it("still works", async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
