import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5001),
  SESSION_TTL_MINUTES: z.coerce.number().int().min(1).default(10),
  PROOF_SECRET: z.string().min(16).default("dev-only-change-me-please"),
  JWT_SECRET: z.string().min(16).default("dev-jwt-secret-change-me-please"),
  JWT_TTL_SECONDS: z.coerce.number().int().min(60).default(3600),
  CORS_ORIGIN: z.string().default("*"),
  INTERNAL_API_KEY: z.string().min(16).default("dev-internal-api-key-please-change"),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
