import { Router } from "express";
import type { SessionService } from "../services/session-service";
import type { VerifierService } from "../services/verifier-service";
import { healthRouter } from "./health";
import { createSessionsRouter } from "./sessions";
import { createProofsRouter } from "./proofs";
import { createVerifyRouter } from "./verify";
import { createVerifierRouter } from "./verifier";
import { createUserRouter } from "./user";

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
  router.use(createUserRouter(verifierService));

  return router;
};
