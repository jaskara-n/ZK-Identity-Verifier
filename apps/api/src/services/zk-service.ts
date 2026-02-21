import { createRequire } from "module";
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

export const getZkBridge = (): ZkBridge => {
  if (cached) return cached;

  const zkNode = require("zk-node") as {
    generateProof: (input: GenerateProofInput & { secret: string }) => Proof;
    verifyProof: (input: VerifyProofInput & { secret: string }) => VerificationResult;
  };

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
