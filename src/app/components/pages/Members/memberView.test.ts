import { describe, expect, it } from "vitest";
import type { Group } from "@/src/shared/types";
import { memberRows } from "./memberView";

const group = {
  id: "g",
  name: "Crew",
  code: "ABC123",
  createdAt: "",
  createdByEmail: "owner@x.com",
  memberEmails: ["zed@x.com", "owner@x.com", "amy@x.com"],
  memberNames: { "owner@x.com": "Olive Owner" },
  memberMetadata: { "amy@x.com": { joinedAt: "2026-09-02T12:00:00Z", imageUrl: "a.png" } },
} as unknown as Group;

describe("memberRows", () => {
  it("puts the owner first, then everyone by name, and marks you", () => {
    const rows = memberRows(group, "zed@x.com");
    expect(rows.map((r) => r.email)).toEqual(["owner@x.com", "amy@x.com", "zed@x.com"]);
    expect(rows[0]).toMatchObject({ role: "Owner", name: "Olive Owner", isYou: false });
    expect(rows[2].isYou).toBe(true);
  });

  it("falls back to the email prefix and shows the join date when known", () => {
    const rows = memberRows(group, "");
    expect(rows.find((r) => r.email === "zed@x.com")).toMatchObject({ name: "zed", joined: "" });
    expect(rows.find((r) => r.email === "amy@x.com")).toMatchObject({ imageUrl: "a.png", joined: "Joined Sep 2" });
  });
});
