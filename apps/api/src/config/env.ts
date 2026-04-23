import { z } from "zod";

const DEV_DEFAULTS = {
  PROOF_SECRET: "dev-only-change-me-please",
  JWT_SECRET: "dev-jwt-secret-change-me-please",
  INTERNAL_API_KEY: "dev-internal-api-key-please-change",
} as const;

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5001),
  SESSION_TTL_MINUTES: z.coerce.number().int().min(1).default(10),
  PROOF_SECRET: z.string().min(16).default(DEV_DEFAULTS.PROOF_SECRET),
  JWT_SECRET: z.string().min(16).default(DEV_DEFAULTS.JWT_SECRET),
  JWT_TTL_SECONDS: z.coerce.number().int().min(60).default(3600),
  CORS_ORIGIN: z.string().default("*"),
  INTERNAL_API_KEY: z.string().min(16).default(DEV_DEFAULTS.INTERNAL_API_KEY),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;

if (env.NODE_ENV === "production") {
  const leaked: string[] = [];
  if (env.PROOF_SECRET === DEV_DEFAULTS.PROOF_SECRET) leaked.push("PROOF_SECRET");
  if (env.JWT_SECRET === DEV_DEFAULTS.JWT_SECRET) leaked.push("JWT_SECRET");
  if (env.INTERNAL_API_KEY === DEV_DEFAULTS.INTERNAL_API_KEY) leaked.push("INTERNAL_API_KEY");
  if (env.CORS_ORIGIN === "*") leaked.push("CORS_ORIGIN (must not be wildcard)");
  if (leaked.length > 0) {
    throw new Error(
      `Production misconfiguration: set ${leaked.join(", ")} to non-default values before booting.`,
    );
  }
}
