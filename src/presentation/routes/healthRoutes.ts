import { Router } from "express";

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

  return r;
}
