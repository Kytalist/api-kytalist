import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../domain/AppError.js";
import { getLogger } from "../../infrastructure/logger.js";

type PrismaKnownError = {
  name: string;
  code: string;
  meta?: Record<string, unknown> | undefined;
  message: string;
};

function isPrismaKnownError(err: unknown): err is PrismaKnownError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === "PrismaClientKnownRequestError" &&
    typeof (err as { code?: unknown }).code === "string"
  );
}

/**
 * Map Prisma errors to AppError. Currently:
 *  - P2002 unique constraint -> 409 CONFLICT
 *  - P2025 record not found  -> 404 NOT_FOUND
 *  - P2003 fk constraint     -> 400 BAD_REQUEST
 */
function fromPrismaError(err: PrismaKnownError): AppError | null {
  if (err.code === "P2002") {
    const target = err.meta?.["target"];
    return new AppError(
      "Resource already exists with the same unique value",
      409,
      "CONFLICT",
      target ? { target } : undefined,
    );
  }
  if (err.code === "P2025") {
    return new AppError("Resource not found", 404, "NOT_FOUND");
  }
  if (err.code === "P2003") {
    return new AppError(
      "Referenced resource does not exist",
      400,
      "BAD_REQUEST",
    );
  }
  return null;
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const log = getLogger();

  let appErr: AppError | null = null;
  if (err instanceof AppError) {
    appErr = err;
  } else if (isPrismaKnownError(err)) {
    appErr = fromPrismaError(err);
  }

  if (appErr) {
    if (appErr.statusCode >= 500) {
      log.error({ err, requestId: req.id }, appErr.message);
    } else {
      log.warn({ requestId: req.id, code: appErr.code }, appErr.message);
    }
    const body: {
      error: { message: string; code: string; details?: unknown };
    } = {
      error: {
        message: appErr.message,
        code: appErr.code ?? "APP_ERROR",
      },
    };
    if (appErr.details !== undefined) {
      body.error.details = appErr.details;
    }
    res.status(appErr.statusCode).json(body);
    return;
  }

  log.error({ err, requestId: req.id }, "Unhandled error");
  res.status(500).json({
    error: {
      message: "Internal server error",
      code: "INTERNAL",
    },
  });
}
