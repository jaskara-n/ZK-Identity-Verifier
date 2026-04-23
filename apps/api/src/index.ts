import { createServer } from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const listenOptionsFor = (port: number) =>
  process.platform === "darwin" || process.platform === "win32"
    ? { port, host: env.HOST }
    : { port, host: env.HOST, reusePort: true };

const maxPortAttempts = env.NODE_ENV === "development" ? 10 : 1;

const startServer = (port: number, remainingAttempts: number) => {
  const app = createApp();
  const server = createServer(app);

  server.once("error", (err: any) => {
    if (err?.code === "EADDRINUSE" && remainingAttempts > 1) {
      logger.warn(`port ${port} in use, trying ${port + 1}... (set PORT to override)`);
      startServer(port + 1, remainingAttempts - 1);
      return;
    }

    const message =
      err?.code === "EADDRINUSE"
        ? `port ${port} is already in use. Set PORT to another value or stop the other process.`
        : `failed to start server: ${err?.message || err}`;
    logger.error(message);
    process.exit(1);
  });

  server.listen(listenOptionsFor(port), () => {
    logger.info(`api listening on ${env.HOST}:${port}`);
  });
};

startServer(env.PORT, maxPortAttempts);
