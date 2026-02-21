import { Router } from "express";
import { z } from "zod";

import type { SessionService } from "../services/session-service";
import { ApiError } from "../utils/errors";

const createSessionSchema = z.object({
  verifierId: z.string().min(3),
  ageThreshold: z.number().int().min(1).max(120).default(18),
});

export const createSessionsRouter = (sessions: SessionService) => {
  const router = Router();

  router.post("/sessions", (req, res, next) => {
    try {
      const input = createSessionSchema.parse(req.body);
      const session = sessions.createSession(input.verifierId, input.ageThreshold);
      res.status(201).json({
        sessionId: session.id,
        verifierId: session.verifierId,
        ageThreshold: session.ageThreshold,
        nonce: session.nonce,
        expiresAt: session.expiresAt.toISOString(),
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        next(new ApiError(422, err.errors[0]?.message ?? "invalid request"));
        return;
      }
      next(err);
    }
  });

  return router;
};
