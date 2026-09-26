import { createHmac, timingSafeEqual } from "node:crypto";

export const GUEST_TOKEN_TTL_SECONDS = 24 * 60 * 60;

const nowSeconds = () => Math.floor(Date.now() / 1000);

function sign(payloadPart: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payloadPart).digest();
}

/** A short-lived, server-signed proof that the holder validated the code of `groupId`. */
export function signGuestToken(groupId: string, now: number = nowSeconds()): string {
  const secret = process.env.GUEST_TOKEN_SECRET;
  if (!secret) {
    throw new Error("GUEST_TOKEN_SECRET is not configured");
  }

  const payloadPart = Buffer.from(
    JSON.stringify({ gid: groupId, exp: now + GUEST_TOKEN_TTL_SECONDS }),
  ).toString("base64url");

  return `${payloadPart}.${sign(payloadPart, secret).toString("base64url")}`;
}

/** Returns the group the token was issued for, or null if it is invalid, tampered or expired. */
export function verifyGuestToken(
  token: string,
  now: number = nowSeconds(),
): { groupId: string } | null {
  const secret = process.env.GUEST_TOKEN_SECRET;
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadPart, signaturePart] = parts;

  const expected = sign(payloadPart, secret);
  const actual = Buffer.from(signaturePart, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const { gid, exp } = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
    if (typeof gid !== "string" || typeof exp !== "number" || exp <= now) return null;
    return { groupId: gid };
  } catch {
    return null;
  }
}
