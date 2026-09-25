import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/errors";
import { assertCanModify, canModify } from "./permissions";

describe("canModify", () => {
  const base = { actorId: "u1", allowedUserIds: ["creator", "payer"], groupOwnerId: "owner" };

  it("allows any listed user", () => {
    expect(canModify({ ...base, actorId: "creator" })).toBe(true);
    expect(canModify({ ...base, actorId: "payer" })).toBe(true);
  });

  it("allows the group owner", () => {
    expect(canModify({ ...base, actorId: "owner" })).toBe(true);
  });

  it("rejects everyone else", () => {
    expect(canModify(base)).toBe(false);
  });

  it("ignores null/undefined entries so a missing creator never matches", () => {
    expect(
      canModify({ actorId: "u1", allowedUserIds: [null, undefined], groupOwnerId: null }),
    ).toBe(false);
  });
});

describe("assertCanModify", () => {
  it("throws ForbiddenError with the message when not allowed", () => {
    expect(() =>
      assertCanModify({ actorId: "u1", allowedUserIds: [], groupOwnerId: "o" }, "nope"),
    ).toThrow(new ForbiddenError("nope"));
  });

  it("does nothing when allowed", () => {
    expect(() =>
      assertCanModify({ actorId: "o", allowedUserIds: [], groupOwnerId: "o" }, "nope"),
    ).not.toThrow();
  });
});
