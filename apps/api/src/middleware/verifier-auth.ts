import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env";
import type { VerifierClient, VerifierService } from "../services/verifier-service";
import { verifyToken } from "../utils/jwt";
import { ApiError } from "../utils/errors";

export type RequestWithVerifier = Request & {
  verifierClient?: VerifierClient;
};

export const requireVerifierClient = (verifierService: VerifierService) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authorization = req.header("authorization");
    if (authorization?.startsWith("Bearer ")) {
      const token = authorization.slice("Bearer ".length).trim();
      const payload = verifyToken(token, env.JWT_SECRET);
      if (!payload) {
        next(new ApiError(401, "invalid verifier token"));
        return;
      }

      const client = verifierService.getClientById(payload.sub);
      if (!client) {
        next(new ApiError(401, "verifier client not found"));
        return;
      }

      (req as RequestWithVerifier).verifierClient = client;
      next();
      return;
    }

    const apiKey = req.header("x-verifier-api-key");
    if (!apiKey) {
      next(new ApiError(401, "missing verifier credentials"));
      return;
    }

    const client = verifierService.authenticateClient(apiKey);
    if (!client) {
      next(new ApiError(401, "invalid verifier api key"));
      return;
    }

    (req as RequestWithVerifier).verifierClient = client;
    next();
  };
};
