import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const requestId = (req as Request & { requestId?: string }).requestId;
  if (err instanceof ApiError) {
    logger.warn("request failed", { requestId, status: err.status, message: err.message });
    res.status(err.status).json({ error: err.message, requestId });
    return;
  }

  logger.error("unexpected error", { requestId, error: (err as Error)?.message || err });
  res.status(500).json({ error: "internal server error", requestId });
};
