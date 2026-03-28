import { createHmac, timingSafeEqual } from "crypto";

export type JwtPayload = {
  sub: string;
  iat: number;
  exp: number;
};

const base64UrlEncode = (value: string) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
};

const signRaw = (data: string, secret: string) =>
  createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

export const issueToken = (payload: JwtPayload, secret: string) => {
  const header = { alg: "HS256", typ: "JWT" };
  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const body = `${headerPart}.${payloadPart}`;
  const signature = signRaw(body, secret);
  return `${body}.${signature}`;
};

export const verifyToken = (token: string, secret: string): JwtPayload | null => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signaturePart] = parts;
  const body = `${headerPart}.${payloadPart}`;
  const expected = signRaw(body, secret);

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signaturePart);
  if (expectedBuffer.length !== actualBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(payloadPart)) as JwtPayload;
    if (typeof parsed.sub !== "string") return null;
    if (typeof parsed.iat !== "number" || typeof parsed.exp !== "number") return null;
    if (Date.now() >= parsed.exp * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
};
