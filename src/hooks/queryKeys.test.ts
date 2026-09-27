import { QueryClient, type QueryKey } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { queryKeys } from "./queryKeys";

/** Caches every key, invalidates `target`, and returns which keys were marked stale. */
function invalidated(keys: QueryKey[], target: QueryKey) {
  const client = new QueryClient();
  for (const key of keys) client.setQueryData(key, {});
  client.invalidateQueries({ queryKey: target });
  return keys.filter((key) => client.getQueryState(key)?.isInvalidated);
}

describe("queryKeys", () => {
  it("refreshes a guest's view of a group when that group changes, and no other group", () => {
    const keys = [queryKeys.groups.detail("g1"), queryKeys.groups.guest("g1"), queryKeys.groups.guest("g2")];

    expect(invalidated(keys, queryKeys.groups.detail("g1"))).toEqual([
      queryKeys.groups.detail("g1"),
      queryKeys.groups.guest("g1"),
    ]);
  });

  it("covers the group list and every group with the groups prefix", () => {
    const keys = [queryKeys.groups.detail("g1"), queryKeys.groups.guest("g2")];

    expect(invalidated(keys, queryKeys.groups.all)).toEqual(keys);
  });

  it("keeps one trip's expenses and payment logs apart from another's", () => {
    const keys = [
      queryKeys.expenses.trip("t1"),
      queryKeys.expenses.trip("t2"),
      queryKeys.paymentLogs.trip("t1"),
    ];

    expect(invalidated(keys, queryKeys.expenses.trip("t1"))).toEqual([queryKeys.expenses.trip("t1")]);
    expect(invalidated(keys, queryKeys.expenses.all)).toEqual([
      queryKeys.expenses.trip("t1"),
      queryKeys.expenses.trip("t2"),
    ]);
  });

  it("refreshes every notification list and the unread count together", () => {
    const keys = [
      queryKeys.notifications.list({ limit: 5 }),
      queryKeys.notifications.list({ limit: 80 }),
      queryKeys.notifications.unreadCount,
    ];

    expect(invalidated(keys, queryKeys.notifications.all)).toEqual(keys);
  });

  it("gives different notification filters and review pages their own cache entries", () => {
    expect(queryKeys.notifications.list({ limit: 5 })).not.toEqual(queryKeys.notifications.list({ limit: 80 }));
    expect(queryKeys.notifications.list()).not.toEqual(queryKeys.notifications.unreadCount);
    expect(queryKeys.reviews.page(1, 10, 5)).not.toEqual(queryKeys.reviews.page(1, 10));
  });
});
