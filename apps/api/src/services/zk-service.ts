import { createRequire } from "module";
import { createHash, createHmac, randomUUID } from "crypto";
import { env } from "../config/env";

export type ProofPayload = {
  sessionId: string;
  verifierId: string;
  ageThreshold: number;
  statement: string;
  nullifier: string;
  issuedAt: string;
};

export type Proof = {
  proofId: string;
  payload: ProofPayload;
  signature: string;
};

export type VerificationResult = {
  verified: boolean;
  reason?: string;
};

export type GenerateProofInput = {
  sessionId: string;
  verifierId: string;
  ageThreshold: number;
  birthDate: string;
  passportNumber: string;
};

export type VerifyProofInput = {
  sessionId: string;
  verifierId: string;
  ageThreshold: number;
  passportNumber: string;
  proof: Proof;
};

export interface ZkBridge {
  generateProof(input: GenerateProofInput): Proof;
  verifyProof(input: VerifyProofInput): VerificationResult;
}

let cached: ZkBridge | null = null;

const require = createRequire(import.meta.url);

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const signatureFor = (payload: ProofPayload, secret: string) =>
  createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");

const fallbackBridge: ZkBridge = {
  generateProof(input) {
    const now = new Date();
    const birth = new Date(input.birthDate);
    if (Number.isNaN(birth.getTime())) {
      throw new Error("invalid birth date");
    }

    const ageDate = new Date(now.getTime() - birth.getTime());
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < input.ageThreshold) {
      throw new Error("age threshold not met");
    }

    const payload: ProofPayload = {
      sessionId: input.sessionId,
      verifierId: input.verifierId,
      ageThreshold: input.ageThreshold,
      statement: `age >= ${input.ageThreshold}`,
      nullifier: sha256(`${input.sessionId}:${input.passportNumber}`),
      issuedAt: now.toISOString(),
    };

    return {
      proofId: randomUUID(),
      payload,
      signature: signatureFor(payload, env.PROOF_SECRET),
    };
  },
  verifyProof(input) {
    const expectedSignature = signatureFor(input.proof.payload, env.PROOF_SECRET);
    if (expectedSignature !== input.proof.signature) {
      return { verified: false, reason: "invalid signature" };
    }

    const expectedNullifier = sha256(`${input.sessionId}:${input.passportNumber}`);
    if (
      input.proof.payload.sessionId !== input.sessionId ||
      input.proof.payload.verifierId !== input.verifierId ||
      input.proof.payload.ageThreshold !== input.ageThreshold ||
      input.proof.payload.nullifier !== expectedNullifier
    ) {
      return { verified: false, reason: "payload mismatch" };
    }

    return { verified: true };
  },
};

export const getZkBridge = (): ZkBridge => {
  if (cached) return cached;

  let zkNode: {
    generateProof: (input: GenerateProofInput & { secret: string }) => Proof;
    verifyProof: (input: VerifyProofInput & { secret: string }) => VerificationResult;
  };
  try {
    zkNode = require("zk-node");
  } catch (err) {
    console.warn(
      `zk-node module is not available. Using JS fallback proof engine for local dev. ${(err as Error).message}`,
    );
    cached = fallbackBridge;
    return cached;
  }

  cached = {
    generateProof(input) {
      return zkNode.generateProof({ ...input, secret: env.PROOF_SECRET });
    },
    verifyProof(input) {
      return zkNode.verifyProof({ ...input, secret: env.PROOF_SECRET });
    },
  };

  return cached;
};
