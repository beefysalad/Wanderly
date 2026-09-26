import { describe, expect, it } from "vitest";
import { notificationHref, notificationKind, timeAgo } from "./notificationMeta";

const base = { relatedGroupId: "g1", relatedTripId: "t1", relatedExpenseId: undefined, relatedActivityId: undefined };

describe("notificationKind", () => {
  it("sorts every type into one of six kinds", () => {
    expect(notificationKind("payment")).toBe("pay");
    expect(notificationKind("payment_rejected")).toBe("pay");
    expect(notificationKind("payment_confirmed")).toBe("ok");
    expect(notificationKind("expense_edited")).toBe("exp");
    expect(notificationKind("group_leave")).toBe("join");
    expect(notificationKind("activity_added")).toBe("act");
    expect(notificationKind("trip_updated")).toBe("trip");
  });
});

describe("notificationHref", () => {
  it("opens the expense for payment and expense notifications", () => {
    expect(notificationHref({ ...base, type: "payment", relatedExpenseId: "e1" })).toBe("/group/g1/expenses/e1");
    expect(notificationHref({ ...base, type: "expense_added", relatedExpenseId: "e1" })).toBe("/group/g1/expenses/e1");
  });

  it("falls back to the trip when the expense or activity is gone", () => {
    expect(notificationHref({ ...base, type: "expense_deleted", relatedExpenseId: "e1" })).toBe("/group/g1/trip/t1");
    expect(notificationHref({ ...base, type: "activity_deleted", relatedActivityId: "a1" })).toBe("/group/g1/trip/t1");
  });

  it("opens the activity, the members page, the trip or the group as appropriate", () => {
    expect(notificationHref({ ...base, type: "activity_added", relatedActivityId: "a1" })).toBe(
      "/group/g1/trip/t1/activities/a1",
    );
    expect(notificationHref({ ...base, type: "group_join" })).toBe("/group/g1/members");
    expect(notificationHref({ ...base, type: "trip_created" })).toBe("/group/g1/trip/t1");
    expect(notificationHref({ ...base, type: "trip_deleted" })).toBe("/group/g1");
    expect(notificationHref({ ...base, type: "trip_updated", relatedTripId: undefined })).toBe("/group/g1");
  });

  it("returns null without a group", () => {
    expect(notificationHref({ ...base, type: "trip_created", relatedGroupId: undefined })).toBeNull();
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-09-26T12:00:00Z");
  it("reads naturally at each scale", () => {
    expect(timeAgo("2026-09-26T11:59:40Z", now)).toBe("Just now");
    expect(timeAgo("2026-09-26T11:48:00Z", now)).toBe("12m ago");
    expect(timeAgo("2026-09-26T09:00:00Z", now)).toBe("3h ago");
    expect(timeAgo("2026-09-24T12:00:00Z", now)).toBe("2d ago");
  });
});
