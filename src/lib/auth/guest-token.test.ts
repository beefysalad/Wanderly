import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GUEST_TOKEN_TTL_SECONDS, signGuestToken, verifyGuestToken } from "./guest-token";

const NOW = 1_800_000_000;

beforeEach(() => {
  process.env.GUEST_TOKEN_SECRET = "test-secret-test-secret-test-secret";
});
afterEach(() => {
  delete process.env.GUEST_TOKEN_SECRET;
});

describe("guest tokens", () => {
  it("round-trips a group id", () => {
    const token = signGuestToken("group-1", NOW);

    expect(verifyGuestToken(token, NOW + 60)).toEqual({ groupId: "group-1" });
  });

  it("expires after the TTL", () => {
    const token = signGuestToken("group-1", NOW);

    expect(verifyGuestToken(token, NOW + GUEST_TOKEN_TTL_SECONDS - 1)).not.toBeNull();
    expect(verifyGuestToken(token, NOW + GUEST_TOKEN_TTL_SECONDS + 1)).toBeNull();
  });

  it("rejects a token whose payload was tampered with", () => {
    const [, signature] = signGuestToken("group-1", NOW).split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ gid: "group-2", exp: NOW + 1000 }),
    ).toString("base64url");

    expect(verifyGuestToken(`${forgedPayload}.${signature}`, NOW)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = signGuestToken("group-1", NOW);
    process.env.GUEST_TOKEN_SECRET = "another-secret-another-secret-123";

    expect(verifyGuestToken(token, NOW)).toBeNull();
  });

  it("rejects garbage without throwing", () => {
    for (const bad of ["", "abc", "a.b.c", "....", "e30.e30"]) {
      expect(verifyGuestToken(bad, NOW)).toBeNull();
    }
  });

  it("refuses to sign, and to verify, without a secret", () => {
    const token = signGuestToken("group-1", NOW);
    delete process.env.GUEST_TOKEN_SECRET;

    expect(() => signGuestToken("group-1", NOW)).toThrow("GUEST_TOKEN_SECRET is not configured");
    expect(verifyGuestToken(token, NOW)).toBeNull();
  });
});
