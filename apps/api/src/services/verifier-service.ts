import { randomBytes, randomUUID } from "crypto";

import type { SessionService } from "./session-service";
import type { Proof, VerificationResult, ZkBridge } from "./zk-service";

export type VerifierClient = {
  id: string;
  name: string;
  apiKey: string;
  createdAt: Date;
};

export type VerificationChallengeStatus = "pending" | "verified" | "rejected" | "expired";

export type VerificationChallenge = {
  id: string;
  clientId: string;
  verifierId: string;
  ageThreshold: number;
  sessionId: string;
  nonce: string;
  status: VerificationChallengeStatus;
  reason?: string;
  result?: VerificationResult;
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
};

export type VerifiableCredentialStatus = "active" | "revoked";

export type VerifiableCredential = {
  id: string;
  clientId: string;
  challengeId: string;
  verifierId: string;
  ageThreshold: number;
  nullifier: string;
  issuedAt: Date;
  status: VerifiableCredentialStatus;
  revokedAt?: Date;
  revokeReason?: string;
};

export class VerifierService {
  private clientsById = new Map<string, VerifierClient>();
  private clientsByKey = new Map<string, VerifierClient>();
  private challenges = new Map<string, VerificationChallenge>();
  private credentials = new Map<string, VerifiableCredential>();

  constructor(
    private readonly sessions: SessionService,
    private readonly zk: ZkBridge,
  ) {}

  registerClient(name: string): VerifierClient {
    const client: VerifierClient = {
      id: randomUUID(),
      name,
      apiKey: `zkv_${randomBytes(24).toString("hex")}`,
      createdAt: new Date(),
    };

    this.clientsById.set(client.id, client);
    this.clientsByKey.set(client.apiKey, client);
    return client;
  }

  authenticateClient(apiKey: string): VerifierClient | undefined {
    return this.clientsByKey.get(apiKey);
  }

  getClientById(clientId: string): VerifierClient | undefined {
    return this.clientsById.get(clientId);
  }

  createChallenge(clientId: string, verifierId: string, ageThreshold: number): VerificationChallenge {
    const session = this.sessions.createSession(verifierId, ageThreshold);

    const challenge: VerificationChallenge = {
      id: randomUUID(),
      clientId,
      verifierId,
      ageThreshold,
      sessionId: session.id,
      nonce: session.nonce,
      status: "pending",
      createdAt: new Date(),
      expiresAt: session.expiresAt,
    };

    this.challenges.set(challenge.id, challenge);
    return challenge;
  }

  getChallenge(challengeId: string): VerificationChallenge | undefined {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return undefined;

    if (challenge.status === "pending" && Date.now() > challenge.expiresAt.getTime()) {
      challenge.status = "expired";
      challenge.reason = "challenge expired";
      this.challenges.set(challenge.id, challenge);
    }

    return challenge;
  }

  submitChallengeProof(input: {
    challengeId: string;
    proof: Proof;
    passportNumber: string;
  }): VerificationChallenge {
    const challenge = this.getChallenge(input.challengeId);
    if (!challenge) {
      throw new Error("challenge not found");
    }

    if (challenge.status !== "pending") {
      throw new Error(`challenge already ${challenge.status}`);
    }

    const result = this.zk.verifyProof({
      sessionId: challenge.sessionId,
      verifierId: challenge.verifierId,
      ageThreshold: challenge.ageThreshold,
      passportNumber: input.passportNumber,
      proof: input.proof,
    });

    challenge.result = result;
    challenge.completedAt = new Date();
    challenge.status = result.verified ? "verified" : "rejected";
    challenge.reason = result.reason;

    this.challenges.set(challenge.id, challenge);

    if (result.verified) {
      const existing = [...this.credentials.values()].find(
        (credential) => credential.challengeId === challenge.id,
      );

      if (!existing) {
        const credential: VerifiableCredential = {
          id: randomUUID(),
          clientId: challenge.clientId,
          challengeId: challenge.id,
          verifierId: challenge.verifierId,
          ageThreshold: challenge.ageThreshold,
          nullifier: input.proof.payload.nullifier,
          issuedAt: new Date(),
          status: "active",
        };
        this.credentials.set(credential.id, credential);
      }
    }

    return challenge;
  }

  listCredentialsForClient(clientId: string): VerifiableCredential[] {
    return [...this.credentials.values()]
      .filter((credential) => credential.clientId === clientId)
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
  }

  revokeCredential(clientId: string, credentialId: string, reason?: string): VerifiableCredential {
    const credential = this.credentials.get(credentialId);
    if (!credential) {
      throw new Error("credential not found");
    }

    if (credential.clientId !== clientId) {
      throw new Error("forbidden");
    }

    if (credential.status === "revoked") {
      return credential;
    }

    credential.status = "revoked";
    credential.revokedAt = new Date();
    credential.revokeReason = reason;
    this.credentials.set(credential.id, credential);

    return credential;
  }
}
