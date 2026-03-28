export type ChallengeState = {
  challengeId: string;
  sessionId: string;
  verifierId: string;
  ageThreshold: number;
};

const KEY = "zk_demo_latest_challenge";

export const saveChallengeState = (value: ChallengeState) => {
  localStorage.setItem(KEY, JSON.stringify(value));
};

export const readChallengeState = (): ChallengeState | null => {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ChallengeState;
  } catch {
    return null;
  }
};
