import type { Response } from "express";

export type Meta = {
  total?: number;
  limit?: number;
  offset?: number;
};

export type Envelope<T> = {
  data: T;
  meta?: Meta;
};

export function ok<T>(res: Response, data: T, meta?: Meta): void {
  const body: Envelope<T> = { data };
  if (meta) body.meta = meta;
  res.json(body);
}

export function created<T>(res: Response, data: T): void {
  res.status(201).json({ data });
}

export function noContent(res: Response): void {
  res.status(204).end();
}
