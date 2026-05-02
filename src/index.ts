import express from "express";
import type { Request, Response } from "express";

const app = express();
const PORT = Number(process.env["PORT"] ?? 3001);
const startedAt = Date.now();

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`api-kytalist listening on http://localhost:${PORT}`);
});
