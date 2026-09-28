import { describe, expect, it } from "vitest";
import { FORMER_MEMBER, transformActivity, transformGroup, transformTrip } from "./transformers";

const alice = { id: "u-alice", name: "Alice", email: "alice@x.com" };
const bob = { id: "u-bob", name: null as string | null, email: "bob@x.com" };

const activityRow = {
  id: "a1",
  date: new Date("2026-10-01"),
  title: "Museum",
  startTime: "09:00",
  endTime: null,
  location: null,
  notes: null,
  done: false,
  transportationMode: null,
  pickupTime: null,
  pickupLocation: null,
  dropoffLocation: null,
};

const tripRow = {
  id: "t1",
  groupId: "g1",
  name: "Japan",
  startDate: new Date("2026-10-01"),
  endDate: new Date("2026-10-10"),
  location: "Tokyo",
  status: "planning" as const,
  createdAt: new Date("2026-09-01"),
  creator: alice,
  activities: [activityRow],
};

const groupRow = {
  id: "g1",
  name: "Crew",
  code: "ABC123",
  colorScheme: "orange",
  emoji: "🌴",
  createdAt: new Date("2026-09-01"),
  creator: alice,
  members: [
    { user: { ...alice, imageUrl: null }, joinedAt: new Date("2026-09-01") },
    { user: { ...bob, imageUrl: "https://img" }, joinedAt: new Date("2026-09-02") },
  ],
  trips: [tripRow],
};

describe("transformGroup", () => {
  it("builds member name/id/metadata maps keyed by email", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = transformGroup(groupRow as any);

    expect(result.memberEmails).toEqual(["alice@x.com", "bob@x.com"]);
    expect(result.memberIds).toEqual({ "alice@x.com": "u-alice", "bob@x.com": "u-bob" });
    expect(result.memberNames).toEqual({ "alice@x.com": "Alice", "bob@x.com": "bob" });
  });

  it("falls back to the email's local part and carries imageUrl when a member has no name", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = transformGroup(groupRow as any);

    expect(result.memberMetadata?.["bob@x.com"]).toEqual({
      joinedAt: "2026-09-02T00:00:00.000Z",
      name: "bob",
      imageUrl: "https://img",
    });
  });

  it("maps the creator's identity and passes trips through transformTrip", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = transformGroup(groupRow as any);

    expect(result.createdBy).toBe("Alice");
    expect(result.createdByEmail).toBe("alice@x.com");
    expect(result.code).toBe("ABC123");
    expect(result.trips).toHaveLength(1);
    expect(result.trips?.[0].id).toBe("t1");
  });
});

describe("transformTrip", () => {
  it("maps fields and nested activities", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = transformTrip(tripRow as any);

    expect(result).toMatchObject({
      id: "t1",
      groupId: "g1",
      name: "Japan",
      location: "Tokyo",
      status: "planning",
      createdBy: "Alice",
      createdById: "u-alice",
    });
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].id).toBe("a1");
  });

  it("shows the former-member placeholder and no id when the creator's account was deleted", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = transformTrip({ ...tripRow, creator: null } as any);

    expect(result.createdBy).toBe(FORMER_MEMBER);
    expect(result.createdById).toBeUndefined();
  });
});

describe("transformActivity", () => {
  it("maps required fields and turns nulls into undefined", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = transformActivity(activityRow as any);

    expect(result).toEqual({
      id: "a1",
      date: "2026-10-01T00:00:00.000Z",
      title: "Museum",
      startTime: "09:00",
      endTime: undefined,
      location: undefined,
      notes: undefined,
      done: false,
      transportationMode: undefined,
      pickupTime: undefined,
      pickupLocation: undefined,
      dropoffLocation: undefined,
    });
  });
});
