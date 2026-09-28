import { blockingQuery, type QueryLike } from "@/src/app/components/shared/StateMessage/loadError";

export type ActivityFormLoadState =
  | { status: "loading" }
  | { status: "error"; query: QueryLike }
  | { status: "not-found"; what: string }
  | { status: "ready" };

interface GetActivityFormLoadStateArgs {
  isLoading: boolean;
  groupQuery: QueryLike;
  trip: unknown;
  /** Pass `undefined` for the add page, which has no activity to find. */
  activity?: unknown;
  /** True for the edit page: a missing activity (not just a missing trip) is also "not found". */
  requireActivity: boolean;
}

/**
 * What the add/edit activity pages should render for the trip (and, when editing, the activity)
 * lookup: a loading state, a real error (instead of spinning forever when the group query fails
 * with nothing cached), "not found" when the ids just don't match anything, or "ready".
 */
export function getActivityFormLoadState({
  isLoading,
  groupQuery,
  trip,
  activity,
  requireActivity,
}: GetActivityFormLoadStateArgs): ActivityFormLoadState {
  if (isLoading) return { status: "loading" };

  const failed = blockingQuery(groupQuery);
  if (failed) return { status: "error", query: failed };

  if (!trip) return { status: "not-found", what: "Trip not found" };
  if (requireActivity && !activity) return { status: "not-found", what: "Activity not found" };

  return { status: "ready" };
}
