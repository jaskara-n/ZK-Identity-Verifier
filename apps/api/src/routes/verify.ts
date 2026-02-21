import { Router } from "express";
import { z } from "zod";

import type { SessionService } from "../services/session-service";
import { getZkBridge } from "../services/zk-service";
import { ApiError } from "../utils/errors";

const proofSchema = z.object({
  proofId: z.string(),
  payload: z.object({
    sessionId: z.string(),
    verifierId: z.string(),
    ageThreshold: z.number().int(),
    statement: z.string(),
    nullifier: z.string(),
    issuedAt: z.string(),
  }),
  signature: z.string(),
});

const verifySchema = z.object({
  sessionId: z.string().uuid(),
  verifierId: z.string().min(3),
  ageThreshold: z.number().int().min(1).max(120),
  passportNumber: z.string().min(5),
  proof: proofSchema,
});

export const createVerifyRouter = (sessions: SessionService) => {
  const router = Router();

  router.post("/verify", (req, res, next) => {
    try {
      const input = verifySchema.parse(req.body);
      const session = sessions.getSession(input.sessionId);
      if (!session) throw new ApiError(404, "session not found");

      const zk = getZkBridge();
      const result = zk.verifyProof(input);
      res.json(result);
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
