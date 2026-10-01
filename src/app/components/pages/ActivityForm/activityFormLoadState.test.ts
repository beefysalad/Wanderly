import { describe, expect, it, vi } from "vitest";
import { getActivityFormLoadState } from "./activityFormLoadState";
import type { QueryLike } from "@/src/app/components/shared/StateMessage/loadError";

const okQuery = (): QueryLike => ({ isError: false, error: null, data: { group: {} }, isFetching: false, refetch: vi.fn() });
const erroredQuery = (status: number): QueryLike => ({
  isError: true,
  error: { isAxiosError: true, response: { status } },
  data: undefined,
  isFetching: false,
  refetch: vi.fn(),
});

describe("getActivityFormLoadState", () => {
  it("reports loading while the group query is still fetching", () => {
    expect(getActivityFormLoadState({ isLoading: true, groupQuery: okQuery(), trip: undefined, requireActivity: false })).toEqual({
      status: "loading",
    });
  });

  it("reports an error (not an endless spinner) when the group query fails with no cached trip", () => {
    // This is the bug: previously the edit page kept "initialLoading" true forever in this case.
    const failed = erroredQuery(500);
    const state = getActivityFormLoadState({ isLoading: false, groupQuery: failed, trip: undefined, requireActivity: false });
    expect(state.status).toBe("error");
    if (state.status === "error") expect(state.query).toBe(failed);
  });

  it("reports an error when a signed-out (401) failure leaves no trip loaded", () => {
    const state = getActivityFormLoadState({ isLoading: false, groupQuery: erroredQuery(401), trip: undefined, requireActivity: false });
    expect(state.status).toBe("error");
  });

  it("reports not-found (not an endless spinner) when the group loads fine but the trip id doesn't match", () => {
    const state = getActivityFormLoadState({ isLoading: false, groupQuery: okQuery(), trip: undefined, requireActivity: false });
    expect(state).toEqual({ status: "not-found", what: "Trip not found" });
  });

  it("reports not-found for a missing activity only when the caller requires one", () => {
    const trip = { id: "t1", startDate: "2026-01-01", endDate: "2026-01-02" };
    expect(getActivityFormLoadState({ isLoading: false, groupQuery: okQuery(), trip, activity: undefined, requireActivity: true })).toEqual({
      status: "not-found",
      what: "Activity not found",
    });
    expect(getActivityFormLoadState({ isLoading: false, groupQuery: okQuery(), trip, activity: undefined, requireActivity: false })).toEqual({
      status: "ready",
      trip,
      activity: undefined,
    });
  });

  it("is ready once the trip (and activity, when required) are loaded", () => {
    const trip = { id: "t1", startDate: "2026-01-01", endDate: "2026-01-02" };
    const activity = { id: "a1" };
    expect(getActivityFormLoadState({ isLoading: false, groupQuery: okQuery(), trip, activity, requireActivity: true })).toEqual({
      status: "ready",
      trip,
      activity,
    });
  });
});
