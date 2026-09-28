import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";
import { blockingQuery, loadErrorCopy, loadFailure } from "./loadError";

const httpError = (status: number) =>
  new AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, undefined, {
    status,
    statusText: "",
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe("loadFailure", () => {
  it("treats a 404 or 403 as the thing being missing, like the page's not-found state", () => {
    expect(loadFailure(httpError(404))).toBe("missing");
    expect(loadFailure(httpError(403))).toBe("missing");
  });

  it("recognises an ended session", () => {
    expect(loadFailure(httpError(401))).toBe("signed-out");
  });

  it("treats server errors, dropped connections and anything else as a retryable failure", () => {
    expect(loadFailure(httpError(500))).toBe("failed");
    expect(loadFailure(new AxiosError("Network Error", "ERR_NETWORK"))).toBe("failed");
    expect(loadFailure(new Error("boom"))).toBe("failed");
  });
});

describe("blockingQuery", () => {
  const query = (over: { isError?: boolean; error?: unknown; data?: unknown }) => ({
    isError: false,
    error: null,
    data: undefined,
    refetch: vi.fn(),
    ...over,
  });

  it("is nothing while every query is fine", () => {
    expect(blockingQuery(query({ data: {} }), query({}))).toBeUndefined();
  });

  it("returns the first query that failed with nothing to show", () => {
    const first = query({ isError: true, error: httpError(500) });
    const second = query({ isError: true, error: httpError(502) });

    expect(blockingQuery(query({ data: {} }), first, second)).toBe(first);
  });

  it("keeps showing the last good data when only a background refetch failed", () => {
    expect(blockingQuery(query({ isError: true, error: httpError(500), data: { group: {} } }))).toBeUndefined();
  });

  it("leaves a 404 or 403 to the page's not-found state", () => {
    expect(blockingQuery(query({ isError: true, error: httpError(404) }))).toBeUndefined();
    expect(blockingQuery(query({ isError: true, error: httpError(403) }))).toBeUndefined();
  });

  it("ignores queries that are switched off", () => {
    expect(blockingQuery(undefined, query({ data: {} }))).toBeUndefined();
  });
});

describe("loadErrorCopy", () => {
  it("offers a retry when loading failed", () => {
    expect(loadErrorCopy("failed", "this trip")).toEqual({
      title: "Couldn't load this trip",
      body: "Something went wrong on our side or the connection dropped.",
      action: "retry",
    });
  });

  it("asks to sign in again instead of retrying when the session ended", () => {
    expect(loadErrorCopy("signed-out", "this trip").action).toBe("sign-in");
  });
});
