import { Router } from "express";
import { z } from "zod";

import type { SessionService } from "../services/session-service";
import { getZkBridge } from "../services/zk-service";
import { ApiError } from "../utils/errors";

const createProofSchema = z.object({
  sessionId: z.string().uuid(),
  verifierId: z.string().min(3),
  ageThreshold: z.number().int().min(1).max(120),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  passportNumber: z.string().min(5),
});

export const createProofsRouter = (sessions: SessionService) => {
  const router = Router();

  router.post("/proofs", (req, res, next) => {
    try {
      const input = createProofSchema.parse(req.body);
      const session = sessions.getSession(input.sessionId);
      if (!session) throw new ApiError(404, "session not found");
      if (session.verifierId !== input.verifierId)
        throw new ApiError(400, "verifier mismatch");
      if (session.ageThreshold !== input.ageThreshold)
        throw new ApiError(400, "age threshold mismatch");
      if (session.used) throw new ApiError(409, "session already used");
      if (Date.now() > session.expiresAt.getTime())
        throw new ApiError(400, "session expired");

      const zk = getZkBridge();
      const proof = zk.generateProof(input);
      sessions.markUsed(input.sessionId);

      res.status(201).json({ proof });
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
