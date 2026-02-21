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
  secret: string;
};

export type VerifyProofInput = {
  sessionId: string;
  verifierId: string;
  ageThreshold: number;
  passportNumber: string;
  proof: Proof;
  secret: string;
};

export function generateProof(input: GenerateProofInput): Proof;
export function verifyProof(input: VerifyProofInput): VerificationResult;
