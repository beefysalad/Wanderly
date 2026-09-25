import { describe, expect, it } from "vitest";
import { isAdminEmail, parseAdminEmails } from "./admin";

describe("parseAdminEmails", () => {
  it("splits on commas, trims, lower-cases and drops empties", () => {
    expect([...parseAdminEmails(" A@x.com, b@X.com ,, ")]).toEqual(["a@x.com", "b@x.com"]);
  });

  it("returns an empty set for undefined or blank input", () => {
    expect(parseAdminEmails(undefined).size).toBe(0);
    expect(parseAdminEmails("  ").size).toBe(0);
  });
});

describe("isAdminEmail", () => {
  const allow = parseAdminEmails("boss@x.com");

  it("accepts an allow-listed verified email, case-insensitively", () => {
    expect(isAdminEmail("Boss@X.com", true, allow)).toBe(true);
  });

  it("rejects an unverified email even if allow-listed", () => {
    expect(isAdminEmail("boss@x.com", false, allow)).toBe(false);
    expect(isAdminEmail("boss@x.com", undefined, allow)).toBe(false);
  });

  it("rejects other or missing emails and an empty allowlist", () => {
    expect(isAdminEmail("other@x.com", true, allow)).toBe(false);
    expect(isAdminEmail(undefined, true, allow)).toBe(false);
    expect(isAdminEmail("boss@x.com", true, new Set())).toBe(false);
  });

  it("reads ADMIN_EMAILS from the environment by default", () => {
    process.env.ADMIN_EMAILS = "env@x.com";

    expect(isAdminEmail("env@x.com", true)).toBe(true);

    delete process.env.ADMIN_EMAILS;
  });
});
