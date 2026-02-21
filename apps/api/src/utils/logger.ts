export type LogLevel = "debug" | "info" | "warn" | "error";

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

const shouldLog = (level: LogLevel) =>
  levelWeight[level] >= levelWeight[currentLevel];

const format = (level: LogLevel, message: string, meta?: Record<string, any>) => {
  const time = new Date().toISOString();
  const base = `${time} [${level.toUpperCase()}] ${message}`;
  if (!meta || Object.keys(meta).length === 0) return base;
  return `${base} ${JSON.stringify(meta)}`;
};

export const logger = {
  debug(message: string, meta?: Record<string, any>) {
    if (shouldLog("debug")) console.log(format("debug", message, meta));
  },
  info(message: string, meta?: Record<string, any>) {
    if (shouldLog("info")) console.log(format("info", message, meta));
  },
  warn(message: string, meta?: Record<string, any>) {
    if (shouldLog("warn")) console.warn(format("warn", message, meta));
  },
  error(message: string, meta?: Record<string, any>) {
    if (shouldLog("error")) console.error(format("error", message, meta));
  },
};
