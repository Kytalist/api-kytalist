import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { errorMiddleware } from "../src/presentation/middleware/errorMiddleware.js";

function buildApp(thrown: unknown) {
  const app = express();
  app.get("/boom", (_req, _res, next) => {
    next(thrown);
  });
  app.use(errorMiddleware);
  return app;
}

describe("errorMiddleware Prisma mapping", () => {
  it("P2002 unique constraint -> 409 CONFLICT", async () => {
    const err = Object.assign(new Error("Unique constraint failed"), {
      name: "PrismaClientKnownRequestError",
      code: "P2002",
      meta: { target: ["featuredOrder"] },
    });
    const res = await request(buildApp(err)).get("/boom");
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
    expect(res.body.error.details).toEqual({ target: ["featuredOrder"] });
  });

  it("P2025 record not found -> 404 NOT_FOUND", async () => {
    const err = Object.assign(new Error("Record not found"), {
      name: "PrismaClientKnownRequestError",
      code: "P2025",
    });
    const res = await request(buildApp(err)).get("/boom");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("P2003 fk violation -> 400 BAD_REQUEST", async () => {
    const err = Object.assign(new Error("FK constraint"), {
      name: "PrismaClientKnownRequestError",
      code: "P2003",
    });
    const res = await request(buildApp(err)).get("/boom");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("unknown error -> 500 INTERNAL", async () => {
    const res = await request(buildApp(new Error("kaboom"))).get("/boom");
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
  });
});
