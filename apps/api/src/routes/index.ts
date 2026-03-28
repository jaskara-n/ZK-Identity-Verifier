import { Router } from "express";
import type { SessionService } from "../services/session-service";
import type { VerifierService } from "../services/verifier-service";
import { healthRouter } from "./health";
import { createSessionsRouter } from "./sessions";
import { createProofsRouter } from "./proofs";
import { createVerifyRouter } from "./verify";
import { createVerifierRouter } from "./verifier";

export const createApiRouter = (
  sessions: SessionService,
  verifierService: VerifierService,
) => {
  const router = Router();

  router.use(healthRouter);
  router.use(createSessionsRouter(sessions));
  router.use(createProofsRouter(sessions));
  router.use(createVerifyRouter(sessions));
  router.use(createVerifierRouter(verifierService));

  return router;
};
