import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindReviewsPage = vi.fn();
const mockCountReviews = vi.fn();
const mockCreateReview = vi.fn();

vi.mock("./repository", () => ({
  findReviewsPage: (...args: unknown[]) => mockFindReviewsPage(...args),
  countReviews: (...args: unknown[]) => mockCountReviews(...args),
  createReview: (...args: unknown[]) => mockCreateReview(...args),
}));

const { createReviewService, listReviewsService } = await import("./services");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listReviewsService", () => {
  it("passes through pagination with no rating filter", async () => {
    mockFindReviewsPage.mockResolvedValue([{ id: "r1" }]);
    mockCountReviews.mockResolvedValue(1);

    const result = await listReviewsService({ page: 2, limit: 5 });

    expect(mockFindReviewsPage).toHaveBeenCalledWith({
      where: {},
      skip: 5,
      take: 5,
    });
    expect(mockCountReviews).toHaveBeenCalledWith({});
    expect(result).toEqual({
      reviews: [{ id: "r1" }],
      total: 1,
      page: 2,
      limit: 5,
      totalPages: 1,
    });
  });

  it("applies the rating filter to both the page query and the count", async () => {
    mockFindReviewsPage.mockResolvedValue([]);
    mockCountReviews.mockResolvedValue(0);

    await listReviewsService({ page: 1, limit: 10, ratingFilter: 4 });

    expect(mockFindReviewsPage).toHaveBeenCalledWith({
      where: { rating: 4 },
      skip: 0,
      take: 10,
    });
    expect(mockCountReviews).toHaveBeenCalledWith({ rating: 4 });
  });

  it("defaults to page 1, limit 10 when not provided", async () => {
    mockFindReviewsPage.mockResolvedValue([]);
    mockCountReviews.mockResolvedValue(0);

    await listReviewsService({});

    expect(mockFindReviewsPage).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
    });
  });
});

describe("createReviewService", () => {
  it("creates a review with trimmed comment and null-coalesced name/email", async () => {
    mockCreateReview.mockResolvedValue({ id: "r1", rating: 5 });

    const result = await createReviewService({
      rating: 5,
      comment: "  Great trip!  ",
      name: "  Alice  ",
      email: undefined,
    });

    expect(mockCreateReview).toHaveBeenCalledWith({
      rating: 5,
      comment: "Great trip!",
      name: "Alice",
      email: null,
    });
    expect(result).toEqual({ id: "r1", rating: 5 });
  });

  it("passes null for name and email when both are omitted", async () => {
    mockCreateReview.mockResolvedValue({ id: "r2", rating: 3 });

    await createReviewService({ rating: 3, comment: "Fine trip overall." });

    expect(mockCreateReview).toHaveBeenCalledWith({
      rating: 3,
      comment: "Fine trip overall.",
      name: null,
      email: null,
    });
  });
});
