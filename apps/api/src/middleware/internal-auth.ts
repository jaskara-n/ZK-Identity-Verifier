import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env";
import { ApiError } from "../utils/errors";

export const requireInternalKey = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const key = req.header("x-internal-api-key");
  if (!key || key !== env.INTERNAL_API_KEY) {
    next(new ApiError(401, "unauthorized"));
    return;
  }

  next();
};
