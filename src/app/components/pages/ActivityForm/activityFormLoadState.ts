import { blockingQuery, type QueryLike } from "@/src/app/components/shared/StateMessage/loadError";

export type ActivityFormLoadState<TTrip, TActivity = never> =
  | { status: "loading" }
  | { status: "error"; query: QueryLike }
  | { status: "not-found"; what: string }
  // Carries the narrowed trip/activity so callers don't need `trip!`/`activity!` assertions
  // that the compiler can't actually verify.
  | { status: "ready"; trip: TTrip; activity: TActivity | undefined };

interface GetActivityFormLoadStateArgs<TTrip, TActivity> {
  isLoading: boolean;
  groupQuery: QueryLike;
  trip: TTrip | null | undefined;
  /** Pass `undefined` for the add page, which has no activity to find. */
  activity?: TActivity | null;
  /** True for the edit page: a missing activity (not just a missing trip) is also "not found". */
  requireActivity: boolean;
}

/**
 * What the add/edit activity pages should render for the trip (and, when editing, the activity)
 * lookup: a loading state, a real error (instead of spinning forever when the group query fails
 * with nothing cached), "not found" when the ids just don't match anything, or "ready" (with the
 * now-narrowed trip/activity attached).
 */
export function getActivityFormLoadState<TTrip, TActivity = never>({
  isLoading,
  groupQuery,
  trip,
  activity,
  requireActivity,
}: GetActivityFormLoadStateArgs<TTrip, TActivity>): ActivityFormLoadState<TTrip, TActivity> {
  if (isLoading) return { status: "loading" };

  const failed = blockingQuery(groupQuery);
  if (failed) return { status: "error", query: failed };

  if (!trip) return { status: "not-found", what: "Trip not found" };
  if (requireActivity && !activity) return { status: "not-found", what: "Activity not found" };

  return { status: "ready", trip, activity: activity ?? undefined };
}
