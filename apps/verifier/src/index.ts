import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5050),
  HOST: z.string().default("0.0.0.0"),
  BACKEND_URL: z.string().url().default("http://localhost:5001"),
  INTERNAL_API_KEY: z.string().min(16).default("dev-internal-api-key-please-change"),
  ZK_APP_URL: z.string().url().default("http://localhost:5173"),
});

const env = envSchema.parse(process.env);
const app = express();

app.use(express.json({ limit: "1mb" }));

const registerSchema = z.object({
  name: z.string().min(2),
  internalApiKey: z.string().min(16).optional(),
});
const createChallengeSchema = z.object({
  accessToken: z.string().min(10),
  verifierId: z.string().min(3),
  ageThreshold: z.number().int().min(1).max(120).default(18),
});
const getChallengeSchema = z.object({
  accessToken: z.string().min(10),
});
const issueTokenSchema = z.object({
  apiKey: z.string().min(10),
});
const listCredentialsSchema = z.object({
  accessToken: z.string().min(10),
});
const revokeCredentialSchema = z.object({
  accessToken: z.string().min(10),
  reason: z.string().min(3).max(160).optional(),
});
const simulateSubmitSchema = z.object({
  challengeId: z.string().min(1),
  verifierId: z.string().min(3),
  ageThreshold: z.number().int().min(1).max(120),
  sessionId: z.string().uuid(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  passportNumber: z.string().min(5),
});

const jsonRequest = async (url: string, init: RequestInit) => {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  return { response, data };
};

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/register-client", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const { response, data } = await jsonRequest(
      `${env.BACKEND_URL}/api/verifier/clients/register`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-api-key": body.internalApiKey ?? env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({ name: body.name }),
      },
    );

    res.status(response.status).json(data);
  } catch (err) {
    next(err);
  }
});

app.post("/challenges", async (req, res, next) => {
  try {
    const body = createChallengeSchema.parse(req.body);

    const { response, data } = await jsonRequest(
      `${env.BACKEND_URL}/api/verifier/challenges`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${body.accessToken}`,
        },
        body: JSON.stringify({
          verifierId: body.verifierId,
          ageThreshold: body.ageThreshold,
        }),
      },
    );

    res.status(response.status).json(data);
  } catch (err) {
    next(err);
  }
});

app.get("/challenges/:challengeId", async (req, res, next) => {
  try {
    const query = getChallengeSchema.parse(req.query);

    const { response, data } = await jsonRequest(
      `${env.BACKEND_URL}/api/verifier/challenges/${req.params.challengeId}`,
      {
        headers: {
          authorization: `Bearer ${query.accessToken}`,
        },
      },
    );

    res.status(response.status).json(data);
  } catch (err) {
    next(err);
  }
});

app.post("/auth/token", async (req, res, next) => {
  try {
    const body = issueTokenSchema.parse(req.body);

    const { response, data } = await jsonRequest(
      `${env.BACKEND_URL}/api/verifier/auth/token`,
      {
        method: "POST",
        headers: {
          "x-verifier-api-key": body.apiKey,
        },
      },
    );

    res.status(response.status).json(data);
  } catch (err) {
    next(err);
  }
});

app.post("/simulate-submit", async (req, res, next) => {
  try {
    const body = simulateSubmitSchema.parse(req.body);

    const generated = await jsonRequest(`${env.BACKEND_URL}/api/proofs`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sessionId: body.sessionId,
        verifierId: body.verifierId,
        ageThreshold: body.ageThreshold,
        birthDate: body.birthDate,
        passportNumber: body.passportNumber,
      }),
    });

    if (!generated.response.ok) {
      res.status(generated.response.status).json(generated.data);
      return;
    }

    const submit = await jsonRequest(
      `${env.BACKEND_URL}/api/verifier/challenges/${body.challengeId}/submit`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          passportNumber: body.passportNumber,
          proof: generated.data.proof,
        }),
      },
    );

    res.status(submit.response.status).json({
      generatedProof: generated.data.proof,
      submitResult: submit.data,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/credentials", async (req, res, next) => {
  try {
    const query = listCredentialsSchema.parse(req.query);

    const { response, data } = await jsonRequest(
      `${env.BACKEND_URL}/api/verifier/credentials`,
      {
        headers: {
          authorization: `Bearer ${query.accessToken}`,
        },
      },
    );

    res.status(response.status).json(data);
  } catch (err) {
    next(err);
  }
});

app.post("/credentials/:credentialId/revoke", async (req, res, next) => {
  try {
    const body = revokeCredentialSchema.parse(req.body);
    const { response, data } = await jsonRequest(
      `${env.BACKEND_URL}/api/verifier/credentials/${req.params.credentialId}/revoke`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${body.accessToken}`,
        },
        body: JSON.stringify({ reason: body.reason }),
      },
    );

    res.status(response.status).json(data);
  } catch (err) {
    next(err);
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

app.get("/config.js", (_req, res) => {
  res.type("application/javascript").send(
    `window.__ZK_APP_URL__ = ${JSON.stringify(env.ZK_APP_URL)};`,
  );
});

app.use(express.static(publicDir));
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof z.ZodError) {
    res.status(422).json({ error: err.errors[0]?.message ?? "invalid request" });
    return;
  }

  if (err instanceof Error) {
    res.status(500).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: "internal server error" });
});

app.listen(env.PORT, env.HOST, () => {
  console.log(`third-party verifier listening on ${env.HOST}:${env.PORT}`);
});
