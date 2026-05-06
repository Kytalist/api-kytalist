import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../domain/AppError.js";

export type ValidationSchemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

/**
 * Express middleware that runs Zod over `req.body | req.query | req.params`.
 * On success, mutates `req.body`/`req.query`/`req.params` to the parsed (typed) value.
 * On failure, throws AppError(400, "VALIDATION", { issues }).
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        const parsed = schemas.body.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(
            "Invalid request body",
            400,
            "VALIDATION",
            parsed.error.issues,
          );
        }
        req.body = parsed.data;
      }
      if (schemas.query) {
        const parsed = schemas.query.safeParse(req.query);
        if (!parsed.success) {
          throw new AppError(
            "Invalid query parameters",
            400,
            "VALIDATION",
            parsed.error.issues,
          );
        }
        // Express 5 query is read-only via prototype getter; assign via Reflect.
        Reflect.set(req, "validatedQuery", parsed.data);
      }
      if (schemas.params) {
        const parsed = schemas.params.safeParse(req.params);
        if (!parsed.success) {
          throw new AppError(
            "Invalid path parameters",
            400,
            "VALIDATION",
            parsed.error.issues,
          );
        }
        Reflect.set(req, "validatedParams", parsed.data);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Read schema-validated query in route handlers. */
export function getValidatedQuery<T>(req: Request): T {
  return Reflect.get(req, "validatedQuery") as T;
}

/** Read schema-validated params in route handlers. */
export function getValidatedParams<T>(req: Request): T {
  return Reflect.get(req, "validatedParams") as T;
}
