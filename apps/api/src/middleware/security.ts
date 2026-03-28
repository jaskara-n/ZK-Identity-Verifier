import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env";

export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("referrer-policy", "no-referrer");
  res.setHeader(
    "content-security-policy",
    "default-src 'self'; frame-ancestors 'none'; base-uri 'self'",
  );
  next();
};

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const configured = env.CORS_ORIGIN;
  if (configured === "*") {
    res.setHeader("access-control-allow-origin", "*");
  } else {
    res.setHeader("access-control-allow-origin", configured);
  }

  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader(
    "access-control-allow-headers",
    "content-type,authorization,x-request-id,x-verifier-api-key,x-internal-api-key",
  );

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
};

const hits = new Map<string, { count: number; resetAt: number }>();

export const basicRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const windowMs = 60_000;
  const max = 120;

  const slot = hits.get(key);
  if (!slot || now > slot.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (slot.count >= max) {
    res.status(429).json({ error: "rate limit exceeded" });
    return;
  }

  slot.count += 1;
  hits.set(key, slot);
  next();
};
