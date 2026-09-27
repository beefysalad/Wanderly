import { isAxiosError } from "axios";

/**
 * What a failed request means for the page: the thing is gone or isn't yours (404/403, which the
 * page's not-found state already explains), the session ended (401), or loading failed and is
 * worth retrying (5xx, dropped connection, anything else).
 */
export type LoadFailure = "missing" | "signed-out" | "failed";

export function loadFailure(error: unknown): LoadFailure {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status === 404 || status === 403) return "missing";
  if (status === 401) return "signed-out";
  return "failed";
}

export interface QueryLike {
  isError: boolean;
  error: unknown;
  data?: unknown;
  isFetching?: boolean;
  refetch: () => unknown;
}

/**
 * The query whose failure should replace the page with an error message: the first one that failed
 * with nothing cached. A failed background refetch keeps showing the last good data, and a
 * "missing" failure falls through to the page's not-found state. `undefined` entries are queries the
 * page doesn't run in this mode (e.g. the member query on a guest page).
 */
export function blockingQuery(...queries: (QueryLike | undefined)[]): QueryLike | undefined {
  return queries.find(
    (query) => !!query && query.isError && query.data === undefined && loadFailure(query.error) !== "missing",
  );
}

export interface LoadErrorCopy {
  title: string;
  body: string;
  action: "retry" | "sign-in";
}

/** The message for a blocking failure; `what` names the thing, e.g. "this trip". */
export function loadErrorCopy(failure: Exclude<LoadFailure, "missing">, what: string): LoadErrorCopy {
  if (failure === "signed-out") {
    return { title: "You're signed out", body: `Sign in again to see ${what}.`, action: "sign-in" };
  }
  return {
    title: `Couldn't load ${what}`,
    body: "Something went wrong on our side or the connection dropped.",
    action: "retry",
  };
}
