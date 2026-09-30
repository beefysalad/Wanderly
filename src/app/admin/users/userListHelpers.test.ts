import { describe, expect, it } from "vitest";
import type { AdminUserSummary } from "@/src/shared/types";
import { filterUsers, getUserStatus } from "./userListHelpers";

describe("getUserStatus", () => {
  it("is offline when the user has never logged in", () => {
    expect(getUserStatus(null)).toBe("offline");
  });

  it("is online within the last 15 minutes", () => {
    const now = new Date("2026-01-01T12:00:00.000Z");
    expect(getUserStatus(new Date("2026-01-01T11:50:00.000Z").toISOString(), now)).toBe("online");
  });

  it("is active between 15 minutes and 24 hours ago", () => {
    const now = new Date("2026-01-01T12:00:00.000Z");
    expect(getUserStatus(new Date("2026-01-01T11:00:00.000Z").toISOString(), now)).toBe("active");
  });

  it("is offline more than 24 hours ago", () => {
    const now = new Date("2026-01-02T12:00:00.000Z");
    expect(getUserStatus(new Date("2026-01-01T11:00:00.000Z").toISOString(), now)).toBe("offline");
  });
});

const user = (overrides: Partial<AdminUserSummary> = {}): AdminUserSummary => ({
  id: "1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  imageUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: null,
  authCreationTime: null,
  stats: { trips: 0, groups: 0 },
  ...overrides,
});

describe("filterUsers", () => {
  const users = [user({ name: "Ada Lovelace", email: "ada@example.com" }), user({ id: "2", name: "Grace Hopper", email: "grace@example.com" })];

  it("matches by name, case-insensitively", () => {
    expect(filterUsers(users, "ada").map((u) => u.id)).toEqual(["1"]);
    expect(filterUsers(users, "GRACE").map((u) => u.id)).toEqual(["2"]);
  });

  it("matches by email", () => {
    expect(filterUsers(users, "grace@example").map((u) => u.id)).toEqual(["2"]);
  });

  it("returns everyone for a blank query", () => {
    expect(filterUsers(users, "")).toHaveLength(2);
  });
});
