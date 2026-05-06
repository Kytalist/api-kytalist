import { Router } from "express";
import { getPrisma } from "../../infrastructure/prisma.js";

const startedAt = Date.now();

export function createHealthRouter(): Router {
  const r = Router();

  r.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    });
  });

  r.get("/health/live", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: Math.floor((Date.now() - startedAt) / 1000),
    });
  });

  r.get("/health/ready", async (_req, res) => {
    try {
      await getPrisma().$queryRaw`SELECT 1`;
      res.status(200).json({ status: "ready" });
    } catch (err) {
      res.status(503).json({
        status: "not-ready",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return r;
}
