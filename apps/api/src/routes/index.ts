import { Router } from "express";
import type { SessionService } from "../services/session-service";
import { healthRouter } from "./health";
import { createSessionsRouter } from "./sessions";
import { createProofsRouter } from "./proofs";
import { createVerifyRouter } from "./verify";

export const createApiRouter = (sessions: SessionService) => {
  const router = Router();

  router.use(healthRouter);
  router.use(createSessionsRouter(sessions));
  router.use(createProofsRouter(sessions));
  router.use(createVerifyRouter(sessions));

  return router;
};
