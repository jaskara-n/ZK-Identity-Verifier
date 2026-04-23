import { Router } from "express";
import { z } from "zod";

import { env } from "../config/env";
import { requireInternalKey } from "../middleware/internal-auth";
import {
  requireVerifierClient,
  type RequestWithVerifier,
} from "../middleware/verifier-auth";
import type { VerifierService } from "../services/verifier-service";
import { issueToken } from "../utils/jwt";
import { ApiError } from "../utils/errors";

const registerClientSchema = z.object({
  name: z.string().min(2),
});

const createChallengeSchema = z.object({
  verifierId: z.string().min(3),
  ageThreshold: z.number().int().min(1).max(120).default(18),
});

const submitChallengeSchema = z.object({
  passportNumber: z.string().min(5),
  proof: z.object({
    proofId: z.string(),
    payload: z.object({
      sessionId: z.string(),
      verifierId: z.string(),
      ageThreshold: z.number().int(),
      statement: z.string(),
      nullifier: z.string(),
      issuedAt: z.string(),
    }),
    signature: z.string(),
  }),
});

const revokeCredentialSchema = z.object({
  reason: z.string().min(3).max(160).optional(),
});

export const createVerifierRouter = (verifierService: VerifierService) => {
  const router = Router();

  router.post("/verifier/auth/token", (req, res, next) => {
    try {
      const apiKey = req.header("x-verifier-api-key");
      if (!apiKey) throw new ApiError(401, "missing verifier api key");

      const client = verifierService.authenticateClient(apiKey);
      if (!client) throw new ApiError(401, "invalid verifier api key");

      const now = Math.floor(Date.now() / 1000);
      const token = issueToken(
        {
          sub: client.id,
          iat: now,
          exp: now + env.JWT_TTL_SECONDS,
        },
        env.JWT_SECRET,
      );

      res.json({
        tokenType: "Bearer",
        accessToken: token,
        expiresIn: env.JWT_TTL_SECONDS,
        clientId: client.id,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/verifier/clients/register", requireInternalKey, (req, res, next) => {
    try {
      const input = registerClientSchema.parse(req.body);
      const client = verifierService.registerClient(input.name);
      res.status(201).json({
        clientId: client.id,
        name: client.name,
        apiKey: client.apiKey,
        createdAt: client.createdAt.toISOString(),
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        next(new ApiError(422, err.errors[0]?.message ?? "invalid request"));
        return;
      }
      next(err);
    }
  });

  router.post(
    "/verifier/challenges",
    requireVerifierClient(verifierService),
    (req, res, next) => {
      try {
        const input = createChallengeSchema.parse(req.body);
        const requester = (req as RequestWithVerifier).verifierClient;
        if (!requester) throw new ApiError(401, "unauthorized");

        const challenge = verifierService.createChallenge(
          requester.id,
          input.verifierId,
          input.ageThreshold,
        );

        res.status(201).json({
          challengeId: challenge.id,
          verifierId: challenge.verifierId,
          ageThreshold: challenge.ageThreshold,
          sessionId: challenge.sessionId,
          nonce: challenge.nonce,
          status: challenge.status,
          expiresAt: challenge.expiresAt.toISOString(),
          // Web/mobile apps can open this route to submit the generated proof.
          submitUrl: `/api/verifier/challenges/${challenge.id}/submit`,
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          next(new ApiError(422, err.errors[0]?.message ?? "invalid request"));
          return;
        }
        next(err);
      }
    },
  );

  router.get(
    "/verifier/challenges/:challengeId/public",
    (req, res, next) => {
      try {
        const info = verifierService.getChallengePublicStatus(req.params.challengeId);
        if (!info) throw new ApiError(404, "challenge not found");

        const { challenge, effectiveStatus, credentialStatus } = info;
        res.json({
          challengeId: challenge.id,
          verifierId: challenge.verifierId,
          ageThreshold: challenge.ageThreshold,
          sessionId: challenge.sessionId,
          nonce: challenge.nonce,
          status: effectiveStatus,
          credentialStatus,
          expiresAt: challenge.expiresAt.toISOString(),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/verifier/challenges/:challengeId",
    requireVerifierClient(verifierService),
    (req, res, next) => {
      try {
        const requester = (req as RequestWithVerifier).verifierClient;
        if (!requester) throw new ApiError(401, "unauthorized");

        const info = verifierService.getChallengePublicStatus(req.params.challengeId);
        if (!info) throw new ApiError(404, "challenge not found");
        const { challenge, effectiveStatus, credentialStatus, credentialId } = info;
        if (challenge.clientId !== requester.id) {
          throw new ApiError(403, "forbidden");
        }

        res.json({
          challengeId: challenge.id,
          status: effectiveStatus,
          credentialStatus,
          credentialId,
          reason: challenge.reason,
          verifierId: challenge.verifierId,
          ageThreshold: challenge.ageThreshold,
          sessionId: challenge.sessionId,
          createdAt: challenge.createdAt.toISOString(),
          expiresAt: challenge.expiresAt.toISOString(),
          completedAt: challenge.completedAt?.toISOString(),
          result: challenge.result,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post("/verifier/challenges/:challengeId/submit", (req, res, next) => {
    try {
      const input = submitChallengeSchema.parse(req.body);
      const challenge = verifierService.submitChallengeProof({
        challengeId: req.params.challengeId,
        passportNumber: input.passportNumber,
        proof: input.proof,
      });

      res.json({
        challengeId: challenge.id,
        status: challenge.status,
        reason: challenge.reason,
        result: challenge.result,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        next(new ApiError(422, err.errors[0]?.message ?? "invalid request"));
        return;
      }

      if (err instanceof Error) {
        if (err.message === "challenge not found") {
          next(new ApiError(404, err.message));
          return;
        }
        next(new ApiError(400, err.message));
        return;
      }

      next(err);
    }
  });

  router.get(
    "/verifier/credentials",
    requireVerifierClient(verifierService),
    (req, res, next) => {
      try {
        const requester = (req as RequestWithVerifier).verifierClient;
        if (!requester) throw new ApiError(401, "unauthorized");

        const credentials = verifierService.listCredentialsForClient(requester.id);
        res.json({
          items: credentials.map((credential) => ({
            credentialId: credential.id,
            challengeId: credential.challengeId,
            verifierId: credential.verifierId,
            ageThreshold: credential.ageThreshold,
            status: credential.status,
            nullifier: credential.nullifier,
            issuedAt: credential.issuedAt.toISOString(),
            revokedAt: credential.revokedAt?.toISOString(),
            revokeReason: credential.revokeReason,
          })),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/verifier/credentials/:credentialId/revoke",
    requireVerifierClient(verifierService),
    (req, res, next) => {
      try {
        const requester = (req as RequestWithVerifier).verifierClient;
        if (!requester) throw new ApiError(401, "unauthorized");

        const input = revokeCredentialSchema.parse(req.body ?? {});
        const credential = verifierService.revokeCredential(
          requester.id,
          req.params.credentialId,
          input.reason,
        );

        res.json({
          credentialId: credential.id,
          status: credential.status,
          revokedAt: credential.revokedAt?.toISOString(),
          revokeReason: credential.revokeReason,
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          next(new ApiError(422, err.errors[0]?.message ?? "invalid request"));
          return;
        }
        if (err instanceof Error) {
          if (err.message === "credential not found") {
            next(new ApiError(404, err.message));
            return;
          }
          if (err.message === "forbidden") {
            next(new ApiError(403, err.message));
            return;
          }
        }
        next(err);
      }
    },
  );

  return router;
};
