import { describe, expect, it } from "vitest";
import { passwordStrength, signUpSchema } from "./authSchema";

describe("signUpSchema", () => {
  const valid = { name: "Maya", email: "maya@x.com", password: "longenough1" };

  it("accepts a name, an email and an 8+ character password", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a short name, a bad email and a short password", () => {
    expect(signUpSchema.safeParse({ ...valid, name: "M" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, password: "short1" }).success).toBe(false);
  });
});

describe("passwordStrength", () => {
  it("scores length, letters plus numbers, and extra length or symbols", () => {
    expect(passwordStrength("")).toBe(0);
    expect(passwordStrength("abcdefgh")).toBe(1);
    expect(passwordStrength("abcdefg1")).toBe(2);
    expect(passwordStrength("abcdefg1!")).toBe(3);
    expect(passwordStrength("abcdefghijk1")).toBe(3);
  });
});
