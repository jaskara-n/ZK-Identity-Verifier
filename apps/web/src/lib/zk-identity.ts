import { API_URL } from "./config";

export type ZkIdentity = {
  id: string;
  birthDate: string;
  passportNumber: string;
  createdAt: string;
};

export type VerificationRecord = {
  id: string;
  partner: string;
  ageThreshold: number;
  result: "verified" | "rejected";
  challengeId: string;
  createdAt: string;
};

const IDENTITY_KEY = "zk_identity";
const HISTORY_KEY = "zk_identity_history";

export const readIdentity = (): ZkIdentity | null => {
  const raw = localStorage.getItem(IDENTITY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ZkIdentity;
  } catch {
    return null;
  }
};

export const saveIdentity = (input: { birthDate: string; passportNumber: string }) => {
  const identity: ZkIdentity = {
    id: crypto.randomUUID(),
    birthDate: input.birthDate,
    passportNumber: input.passportNumber,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  return identity;
};

export const clearIdentity = () => {
  localStorage.removeItem(IDENTITY_KEY);
};

export const readHistory = (): VerificationRecord[] => {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const pushHistory = (record: VerificationRecord) => {
  const next = [record, ...readHistory()].slice(0, 20);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

export type ChallengePublic = {
  challengeId: string;
  sessionId: string;
  verifierId: string;
  ageThreshold: number;
  status: "pending" | "verified" | "rejected";
  expiresAt?: string;
};

export const fetchChallengePublic = async (challengeId: string): Promise<ChallengePublic> => {
  const res = await fetch(`${API_URL}/verifier/challenges/${encodeURIComponent(challengeId)}/public`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Failed to load challenge (${res.status})`);
  }
  return data as ChallengePublic;
};

export const generateAndSubmitProof = async (args: {
  challengeId: string;
  sessionId: string;
  verifierId: string;
  ageThreshold: number;
  identity: ZkIdentity;
}): Promise<{ status: "verified" | "rejected"; reason?: string }> => {
  const proofRes = await fetch(`${API_URL}/proofs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sessionId: args.sessionId,
      verifierId: args.verifierId,
      ageThreshold: args.ageThreshold,
      birthDate: args.identity.birthDate,
      passportNumber: args.identity.passportNumber,
    }),
  });
  const proofData = await proofRes.json().catch(() => ({}));
  if (!proofRes.ok) {
    throw new Error((proofData as { error?: string }).error || `Proof generation failed (${proofRes.status})`);
  }

  const submitRes = await fetch(`${API_URL}/verifier/challenges/${encodeURIComponent(args.challengeId)}/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      passportNumber: args.identity.passportNumber,
      proof: (proofData as { proof?: unknown }).proof,
    }),
  });
  const submitData = await submitRes.json().catch(() => ({}));
  if (!submitRes.ok) {
    throw new Error((submitData as { error?: string }).error || `Submit failed (${submitRes.status})`);
  }

  const status = (submitData as { status?: "verified" | "rejected" }).status || "rejected";
  return {
    status,
    reason: (submitData as { reason?: string }).reason,
  };
};
