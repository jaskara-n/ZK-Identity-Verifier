import express from "express";

import { requestId } from "./middleware/request-id";
import { errorHandler } from "./middleware/error-handler";
import {
  basicRateLimit,
  corsMiddleware,
  securityHeaders,
} from "./middleware/security";
import { createApiRouter } from "./routes";
import { SessionService } from "./services/session-service";
import { VerifierService } from "./services/verifier-service";
import { getZkBridge } from "./services/zk-service";
import { logger } from "./utils/logger";

export const createApp = () => {
  const app = express();
  const zkBridge = getZkBridge();
  const sessions = new SessionService();
  const verifierService = new VerifierService(sessions, zkBridge);

  app.disable("x-powered-by");
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(basicRateLimit);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(requestId);

  app.use((req, _res, next) => {
    logger.debug("incoming request", { method: req.method, path: req.path });
    next();
  });

  app.use("/api", createApiRouter(sessions, verifierService));

  app.use(errorHandler);

  return app;
};
