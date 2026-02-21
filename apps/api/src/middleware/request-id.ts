import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = req.header("x-request-id") || randomUUID();
  res.setHeader("x-request-id", id);
  (req as Request & { requestId?: string }).requestId = id;
  next();
};
