import { describe, expect, it } from "vitest";

import { listReviewsQuerySchema } from "./schemas";

describe("listReviewsQuerySchema", () => {
  it("defaults to page 1, limit 10 with rating omitted for empty input", () => {
    const result = listReviewsQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ page: 1, limit: 10 });
      expect(result.data.rating).toBeUndefined();
    }
  });

  it("fails validation when page is below the minimum", () => {
    const result = listReviewsQuerySchema.safeParse({ page: "0" });

    expect(result.success).toBe(false);
  });

  it("fails validation when rating is above the maximum", () => {
    const result = listReviewsQuerySchema.safeParse({ rating: "6" });

    expect(result.success).toBe(false);
  });

  it("fails validation when limit is above the maximum", () => {
    const result = listReviewsQuerySchema.safeParse({ limit: "10001" });

    expect(result.success).toBe(false);
  });

  it("succeeds when limit is exactly at the maximum boundary (10000)", () => {
    const result = listReviewsQuerySchema.safeParse({ limit: "10000" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10000);
    }
  });

  it("parses a fully-specified valid input to the expected coerced numeric shape", () => {
    const result = listReviewsQuerySchema.safeParse({
      page: "2",
      limit: "5",
      rating: "3",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ page: 2, limit: 5, rating: 3 });
    }
  });
});
