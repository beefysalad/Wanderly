import { describe, expect, it } from "vitest";
import { activeGroupId, activeNavKey } from "./nav";

describe("activeNavKey", () => {
  it("maps the top-level pages to themselves", () => {
    expect(activeNavKey("/dashboard")).toBe("home");
    expect(activeNavKey("/trips")).toBe("trips");
    expect(activeNavKey("/groups")).toBe("groups");
    expect(activeNavKey("/profile")).toBe("profile");
  });

  it("leaves the notifications page out of the nav (it opens from the bell)", () => {
    expect(activeNavKey("/notifications")).toBeNull();
  });

  it("keeps create and join group under Home, and everything else inside a group under Groups", () => {
    expect(activeNavKey("/group/create")).toBe("home");
    expect(activeNavKey("/group/join")).toBe("home");
    expect(activeNavKey("/group/g1")).toBe("groups");
    expect(activeNavKey("/group/g1/trip/t1")).toBe("groups");
    expect(activeNavKey("/group/g1/expenses/add")).toBe("groups");
  });
});

describe("activeGroupId", () => {
  it("returns the group id from a group path, but not for create or join", () => {
    expect(activeGroupId("/group/g1")).toBe("g1");
    expect(activeGroupId("/group/g1/trip/t1")).toBe("g1");
    expect(activeGroupId("/group/create")).toBeNull();
    expect(activeGroupId("/group/join")).toBeNull();
    expect(activeGroupId("/dashboard")).toBeNull();
  });
});
