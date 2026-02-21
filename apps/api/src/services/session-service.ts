import { randomUUID } from "crypto";
import { env } from "../config/env";

export type Session = {
  id: string;
  verifierId: string;
  ageThreshold: number;
  nonce: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
};

export class SessionService {
  private sessions = new Map<string, Session>();

  createSession(verifierId: string, ageThreshold: number): Session {
    const now = new Date();
    const session: Session = {
      id: randomUUID(),
      verifierId,
      ageThreshold,
      nonce: randomUUID(),
      createdAt: now,
      expiresAt: new Date(now.getTime() + env.SESSION_TTL_MINUTES * 60 * 1000),
      used: false,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  markUsed(id: string) {
    const session = this.sessions.get(id);
    if (session) {
      session.used = true;
      this.sessions.set(id, session);
    }
  }

  isValid(id: string): { ok: boolean; reason?: string } {
    const session = this.sessions.get(id);
    if (!session) return { ok: false, reason: "session not found" };
    if (session.used) return { ok: false, reason: "session already used" };
    if (Date.now() > session.expiresAt.getTime())
      return { ok: false, reason: "session expired" };
    return { ok: true };
  }
}
