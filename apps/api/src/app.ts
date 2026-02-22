import express from "express";
import { requestId } from "./middleware/request-id";
import { errorHandler } from "./middleware/error-handler";
import { createApiRouter } from "./routes";
import { SessionService } from "./services/session-service";
import { logger } from "./utils/logger";

export const createApp = () => {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(requestId);

  app.use((req, _res, next) => {
    logger.debug("incoming request", { method: req.method, path: req.path });
    next();
  });

  const sessions = new SessionService();

  app.use("/api", createApiRouter(sessions));

  console.log("working ")

  app.use(errorHandler);

  return app;
};
