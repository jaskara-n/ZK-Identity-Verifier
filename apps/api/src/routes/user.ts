import { Router } from "express";
import { z } from "zod";

import type { VerifierService } from "../services/verifier-service";
import { ApiError } from "../utils/errors";

const revokeSchema = z.object({
  passportNumber: z.string().min(5),
  reason: z.string().min(3).max(160).default("User revoked their identity"),
});

export const createUserRouter = (verifierService: VerifierService) => {
  const router = Router();

  router.post("/user/revoke-identity", (req, res, next) => {
    try {
      const input = revokeSchema.parse(req.body);
      const revoked = verifierService.revokeAllForPassport(input.passportNumber, input.reason);
      res.json({
        revokedCount: revoked.length,
        credentialIds: revoked.map((item) => item.id),
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
