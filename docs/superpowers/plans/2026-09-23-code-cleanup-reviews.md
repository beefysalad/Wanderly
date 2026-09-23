# Reviews Feature Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Reviews feature (`/api/reviews`, and the `Reviews` page component) to the repository/service/route architecture and component-decomposition conventions from `CLAUDE.md`.

**Architecture:** Extract the two direct Prisma calls in `src/app/api/reviews/services.ts` into a new `repository.ts`; keep business logic in `services.ts` (which currently duplicates validation Zod already does — remove that duplication) throwing typed errors from `lib/errors.ts`; add a Zod schema for the GET route's pagination/filter query params (POST already validates via the existing `reviewsSchema`, shared with the frontend form — keep that file as the single source, don't duplicate it); route handlers become thin wrappers using `handleApiError()`. The 546-line `Reviews` page component is split into `ReviewsStats`, `ReviewForm`, and `ReviewsList`.

**Tech Stack:** Next.js 15 App Router, Prisma, Zod, Vitest, React Hook Form.

**Spec:** `docs/superpowers/specs/2026-09-22-code-cleanup-design.md`

**Depends on:** `docs/superpowers/plans/2026-09-22-code-cleanup-foundation.md` must be merged (or its branch available) first — this plan uses `lib/errors.ts` (`ValidationError`) and `lib/handle-api-error.ts`.

## Global Constraints

- No AI/Claude Code attribution in commit messages or PR descriptions.
- One branch/PR (`refactor/reviews-service-repo`), left fully working at the end.
- The rate-limiting logic in `route.ts` (`reviewsRateLimiter`, `getClientIP`) is a cross-cutting HTTP concern, not business logic — it stays in the route handler, not the service.
- No behavior change beyond: (a) GET's pagination/rating-filter query params are now validated with Zod instead of manual `if` checks — same effective bounds (page ≥ 1, 1 ≤ limit ≤ 10000, 1 ≤ rating ≤ 5) and still a 400 status on failure, but the response body now comes from `handleApiError`'s ZodError branch (`{ error: "Invalid request", issues: {...} }`) instead of the old specific messages (`"Invalid pagination parameters"` / `"Rating filter must be between 1 and 5"`) — same shape/pattern already used by every other migrated route (e.g. Profile); (b) unexpected errors return a generic message instead of leaking `error.message`.
- `src/app/components/pages/Reviews/reviewsZod.ts` (the POST body schema, `reviewsSchema`) is shared with the frontend form's `zodResolver` — do not move or duplicate it; the API route continues to import it from there.

---

### Task 1: Repository, services, schemas, and route handlers

**Files:**
- Create: `src/app/api/reviews/repository.ts`
- Create: `src/app/api/reviews/schemas.ts`
- Modify: `src/app/api/reviews/services.ts`
- Create: `src/app/api/reviews/services.test.ts`
- Modify: `src/app/api/reviews/route.ts`

**Interfaces:**
- Consumes: `ValidationError` from `@/lib/errors`; `handleApiError` from `@/lib/handle-api-error`; `reviewsSchema` from `@/src/app/components/pages/Reviews/reviewsZod` (unchanged, existing).
- Produces: `findReviewsPage(params)`, `countReviews(where)`, `createReview(data)` from `repository.ts`. `listReviewsService(params)`, `createReviewService(data)` from `services.ts` (same names/shapes as today, so `route.ts`'s imports don't change). `listReviewsQuerySchema` from `schemas.ts`.

- [ ] **Step 1: Create the repository**

Create `src/app/api/reviews/repository.ts`:

```ts
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface FindReviewsPageParams {
  where: Prisma.ReviewWhereInput;
  skip: number;
  take: number;
}

export function findReviewsPage({ where, skip, take }: FindReviewsPageParams) {
  return prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

export function countReviews(where: Prisma.ReviewWhereInput) {
  return prisma.review.count({ where });
}

export interface CreateReviewRow {
  rating: number;
  comment: string;
  name: string | null;
  email: string | null;
}

export function createReview(data: CreateReviewRow) {
  return prisma.review.create({ data });
}
```

(No test file for this one — thin Prisma passthroughs aren't unit tested in this pass, per the design spec's testing strategy.)

- [ ] **Step 2: Create the query-params schema**

Create `src/app/api/reviews/schemas.ts`:

```ts
import { z } from "zod";

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(10000).default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
```

- [ ] **Step 3: Write the failing tests for the services**

Create `src/app/api/reviews/services.test.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm run test -- src/app/api/reviews/services.test.ts`
Expected: FAIL with "Cannot find module './repository'" (the file doesn't exist yet — wait, Step 1 already created it; the failure here should instead come from `services.ts` not yet importing/matching the new repository shape, since `services.ts` currently calls `prisma` directly and won't match these mocked call signatures). Run the test after Step 1's repository exists but before Step 5's `services.ts` rewrite: it will FAIL because the real `services.ts` still imports `@/lib/prisma` directly and never calls the mocked `findReviewsPage`/`countReviews`/`createReview`, so the assertions on those mocks will fail (received 0 calls).

- [ ] **Step 5: Rewrite the services to use the repository, and stop re-validating what Zod already validates**

Replace the full contents of `src/app/api/reviews/services.ts`:

```ts
import { logger } from "@/lib/logger";
import { countReviews, createReview, findReviewsPage } from "./repository";

export interface ListReviewsParams {
  page?: number;
  limit?: number;
  ratingFilter?: number;
}

export async function listReviewsService({
  page = 1,
  limit = 10,
  ratingFilter,
}: ListReviewsParams = {}) {
  const skip = (page - 1) * limit;
  const take = limit;
  const where = ratingFilter ? { rating: ratingFilter } : {};

  const [reviews, total] = await Promise.all([
    findReviewsPage({ where, skip, take }),
    countReviews(where),
  ]);

  logger.info("Reviews listed", {
    page,
    limit,
    ratingFilter,
    total,
    returned: reviews.length,
  });

  return {
    reviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export interface CreateReviewData {
  rating: number;
  comment: string;
  name?: string;
  email?: string;
}

export async function createReviewService(data: CreateReviewData) {
  const review = await createReview({
    rating: data.rating,
    comment: data.comment.trim(),
    name: data.name?.trim() || null,
    email: data.email?.trim() || null,
  });

  logger.info("Review created", { reviewId: review.id, rating: review.rating });

  return review;
}
```

Note: the old manual `rating < 1 || rating > 5` and empty-comment checks are removed — `reviewsSchema` (POST body) and `listReviewsQuerySchema` (GET query) now enforce these at the route boundary before the service is ever called, so re-checking here was dead-weight duplication.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test -- src/app/api/reviews/services.test.ts`
Expected: PASS — 5 tests passed.

- [ ] **Step 7: Rewrite the route handlers to be thin**

Replace the full contents of `src/app/api/reviews/route.ts`:

```ts
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { reviewsRateLimiter, getClientIP } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/handle-api-error";
import { createReviewService, listReviewsService } from "./services";
import { listReviewsQuerySchema } from "./schemas";
import { reviewsSchema } from "@/src/app/components/pages/Reviews/reviewsZod";

/**
 * GET /api/reviews
 * List all reviews with pagination and optional rating filter
 * Public route - no authentication required
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const { page, limit, rating } = listReviewsQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      rating: searchParams.get("rating") ?? undefined,
    });

    const result = await listReviewsService({
      page,
      limit,
      ratingFilter: rating,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/reviews
 * Create a new review
 * Public route - no authentication required, but rate limited
 */
export async function POST(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);

    const rateLimitResult = reviewsRateLimiter.check(clientIP);
    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded", {
        ip: clientIP,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
      });
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "3",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
            "Retry-After": Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    const data = reviewsSchema.parse(await req.json());

    const review = await createReviewService({
      rating: data.rating,
      comment: data.comment,
      name: data.name,
      email: data.email,
    });

    logger.info("Review created via API", {
      reviewId: review.id,
      rating: review.rating,
      ip: clientIP,
    });

    return NextResponse.json(
      { review },
      {
        status: 201,
        headers: {
          "X-RateLimit-Limit": "3",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
```

- [ ] **Step 8: Run the full test suite and typecheck**

Run: `npm run test && npx tsc --noEmit`
Expected: all tests pass; no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/reviews
git commit -m "refactor: split reviews API into repository/service/route layers with Zod validation"
```

---

### Task 2: Component decomposition

**Files:**
- Create: `src/app/components/pages/Reviews/components/ReviewsStats.tsx`
- Create: `src/app/components/pages/Reviews/components/ReviewForm.tsx`
- Create: `src/app/components/pages/Reviews/components/ReviewsList.tsx`
- Modify: `src/app/components/pages/Reviews/index.tsx`

**Interfaces:**
- Produces: `ReviewsStats`, `ReviewForm`, `ReviewsList` — consumed only by `Reviews/index.tsx`.

- [ ] **Step 1: Create the stats-cards component**

Create `src/app/components/pages/Reviews/components/ReviewsStats.tsx`:

```tsx
import { Star, TrendingUp } from "lucide-react";
import type { Review } from "@/src/shared/types";

interface ReviewsStatsProps {
  allReviews: Review[];
  isLoading: boolean;
}

export function ReviewsStats({ allReviews, isLoading }: ReviewsStatsProps) {
  const calculateAverageRating = () => {
    if (allReviews.length === 0) return "0";
    const sum = allReviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / allReviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0];
    allReviews.forEach((review) => {
      distribution[review.rating - 1]++;
    });
    return distribution.reverse();
  };

  const getPercentage = (count: number) => {
    if (allReviews.length === 0) return 0;
    return Math.round((count / allReviews.length) * 100);
  };

  const ratingDistribution = getRatingDistribution();

  return (
    <div className='grid md:grid-cols-3 gap-6 max-w-4xl mx-auto'>
      {isLoading ? (
        <>
          <div className='bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 text-center'>
            <div className='text-5xl font-bold text-amber-400 mb-2'>
              <div className='w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto'></div>
            </div>
            <p className='text-sm text-slate-400 mt-4'>Loading</p>
          </div>
          <div className='bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 text-center'>
            <div className='text-5xl font-bold text-purple-400 mb-2'>
              <div className='w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto'></div>
            </div>
            <p className='text-sm text-slate-400 mt-4'>Loading</p>
          </div>
          <div className='bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 text-center'>
            <div className='text-5xl font-bold text-emerald-400 mb-2'>
              <div className='w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto'></div>
            </div>
            <p className='text-sm text-slate-400 mt-4'>Loading</p>
          </div>
        </>
      ) : (
        <>
          <div className='bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 text-center'>
            <div className='text-5xl font-bold text-amber-400 mb-2'>
              {calculateAverageRating()}
            </div>
            <div className='flex justify-center mb-2'>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(Number(calculateAverageRating()))
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-600 text-slate-600"
                  }`}
                />
              ))}
            </div>
            <p className='text-sm text-slate-400'>Average Rating</p>
          </div>

          <div className='bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 text-center'>
            <div className='text-5xl font-bold text-purple-400 mb-2'>
              {allReviews.length}
            </div>
            <div className='flex items-center justify-center gap-2 mb-2'>
              <TrendingUp className='w-5 h-5 text-purple-400' />
            </div>
            <p className='text-sm text-slate-400'>Total Reviews</p>
          </div>

          <div className='bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 text-center'>
            <div className='text-5xl font-bold text-emerald-400 mb-2'>
              {allReviews.length > 0 ? getPercentage(ratingDistribution[0]) : 0}%
            </div>
            <div className='flex justify-center mb-2'>
              <Star className='w-5 h-5 fill-emerald-400 text-emerald-400' />
              <Star className='w-5 h-5 fill-emerald-400 text-emerald-400' />
              <Star className='w-5 h-5 fill-emerald-400 text-emerald-400' />
              <Star className='w-5 h-5 fill-emerald-400 text-emerald-400' />
              <Star className='w-5 h-5 fill-emerald-400 text-emerald-400' />
            </div>
            <p className='text-sm text-slate-400'>5-Star Reviews</p>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the review-submission form component**

Create `src/app/components/pages/Reviews/components/ReviewForm.tsx`:

```tsx
"use client";
import { Send, Star } from "lucide-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { TReviewsSchema } from "../reviewsZod";

interface ReviewFormProps {
  form: UseFormReturn<TReviewsSchema>;
  onSubmit: (values: TReviewsSchema) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  rateLimitError: string | null;
}

export function ReviewForm({
  form,
  onSubmit,
  onCancel,
  isSubmitting,
  rateLimitError,
}: ReviewFormProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className='bg-white/5 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-6 md:p-10 shadow-2xl'>
      <div className='flex items-center justify-between mb-8'>
        <h2 className='text-3xl font-bold'>Write a Review</h2>
        <button
          onClick={onCancel}
          className='text-slate-400 hover:text-white transition-colors text-sm'
        >
          Cancel
        </button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div>
          <label className='block text-sm font-semibold mb-4 text-amber-400'>
            How would you rate your experience?
          </label>
          <div className='flex gap-3 justify-center md:justify-start'>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type='button'
                onClick={() => form.setValue("rating", star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className='transition-all hover:scale-125 active:scale-95'
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || form.watch("rating") || 0)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-700 text-slate-700 hover:fill-slate-600"
                  }`}
                />
              </button>
            ))}
          </div>
          {form.formState.errors.rating && (
            <p className='text-red-400 text-sm mt-2'>
              {form.formState.errors.rating.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='comment'
            className='block text-sm font-semibold mb-3 text-amber-400'
          >
            Tell us more
          </label>
          <textarea
            id='comment'
            {...form.register("comment")}
            rows={5}
            className='w-full px-5 py-4 bg-slate-900/70 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-500 transition-all'
            placeholder='What did you love about Wanderly? Any suggestions?'
          />
          {form.formState.errors.comment && (
            <p className='text-red-400 text-sm mt-2'>
              {form.formState.errors.comment.message}
            </p>
          )}
        </div>

        <div className='grid md:grid-cols-2 gap-5'>
          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium mb-2 text-slate-300'
            >
              Name (Optional)
            </label>
            <input
              type='text'
              id='name'
              {...form.register("name")}
              className='w-full px-5 py-3 bg-slate-900/70 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-500 transition-all'
              placeholder='Your name'
            />
          </div>

          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium mb-2 text-slate-300'
            >
              Email (Optional)
            </label>
            <input
              type='email'
              id='email'
              {...form.register("email")}
              className='w-full px-5 py-3 bg-slate-900/70 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-500 transition-all'
              placeholder='your@email.com'
            />
            {form.formState.errors.email && (
              <p className='text-red-400 text-sm mt-2'>
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
        </div>

        {rateLimitError && (
          <div className='bg-red-500/10 border border-red-500/30 rounded-xl p-4'>
            <p className='text-red-400 text-sm'>{rateLimitError}</p>
          </div>
        )}

        <button
          type='submit'
          disabled={
            isSubmitting || !form.watch("rating") || !form.watch("comment")?.trim()
          }
          className='w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-base hover:from-amber-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-amber-500/50 hover:scale-[1.02]'
        >
          <Send className='w-5 h-5' />
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create the filters + list + pagination component**

Create `src/app/components/pages/Reviews/components/ReviewsList.tsx`:

```tsx
import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Review } from "@/src/shared/types";

interface ReviewsListProps {
  reviews: Review[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  starFilter: number | null;
  onStarFilterChange: (filter: number | null) => void;
  currentPage: number;
  totalPages: number;
  totalReviews: number;
  reviewsPerPage: number;
  onPageChange: (page: number) => void;
}

function formatDate(dateString: string) {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function ReviewsList({
  reviews,
  isLoading,
  isError,
  error,
  starFilter,
  onStarFilterChange,
  currentPage,
  totalPages,
  totalReviews,
  reviewsPerPage,
  onPageChange,
}: ReviewsListProps) {
  return (
    <>
      {!isLoading && (
        <div className='flex flex-wrap justify-center gap-3 mb-8'>
          <button
            onClick={() => onStarFilterChange(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              starFilter === null
                ? "bg-amber-500 text-white shadow-lg"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            All Reviews
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => onStarFilterChange(stars)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                starFilter === stars
                  ? "bg-amber-500 text-white shadow-lg"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              <Star className='w-4 h-4 fill-current' />
              {stars}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className='text-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10'>
          <div className='w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center'>
            <div className='w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin'></div>
          </div>
          <p className='text-slate-300 text-xl'>Loading</p>
        </div>
      ) : isError ? (
        <div className='text-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10'>
          <div className='w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center'>
            <Star className='w-10 h-10 text-red-400' />
          </div>
          <p className='text-slate-300 text-xl mb-2'>Failed to load reviews</p>
          <p className='text-slate-500'>
            {error instanceof Error ? error.message : "Please try again later"}
          </p>
        </div>
      ) : reviews.length === 0 ? (
        <div className='text-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10'>
          <div className='w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center'>
            <Star className='w-10 h-10 text-amber-400' />
          </div>
          <p className='text-slate-300 text-xl mb-2'>
            {starFilter ? `No ${starFilter}-star reviews yet` : "No reviews yet"}
          </p>
          <p className='text-slate-500'>
            {starFilter ? "Try a different filter" : "Be the first to share your experience!"}
          </p>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {reviews.map((review) => (
              <div
                key={review.id}
                className='bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10'
              >
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-base'>
                    {(review.name || review.email || "A")[0].toUpperCase()}
                  </div>
                  <div className='flex-1'>
                    <p className='font-semibold text-white text-sm'>
                      {review.name || review.email || "Anonymous"}
                    </p>
                    <p className='text-xs text-slate-400'>
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-1 mb-3'>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-700 text-slate-700"
                      }`}
                    />
                  ))}
                </div>

                <p className='text-slate-200 leading-relaxed text-sm'>
                  {review.comment}
                </p>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className='flex items-center justify-center gap-4 mt-12'>
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className='p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
              >
                <ChevronLeft className='w-5 h-5' />
              </button>

              <div className='flex items-center gap-2'>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      currentPage === page
                        ? "bg-amber-500 text-white shadow-lg"
                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className='p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
              >
                <ChevronRight className='w-5 h-5' />
              </button>
            </div>
          )}

          <p className='text-center text-slate-400 text-sm mt-6'>
            Showing{" "}
            {reviews.length > 0 ? (currentPage - 1) * reviewsPerPage + 1 : 0}-
            {Math.min(currentPage * reviewsPerPage, totalReviews)} of {totalReviews}{" "}
            reviews
          </p>
        </>
      )}
    </>
  );
}
```

- [ ] **Step 4: Slim down `index.tsx` to orchestrate the three components**

Replace the full contents of `src/app/components/pages/Reviews/index.tsx`:

```tsx
"use client";
import { useCreateReview, useReviews } from "@/src/hooks/useReviews";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Footer from "../../shared/Footer";
import { ReviewForm } from "./components/ReviewForm";
import { ReviewsList } from "./components/ReviewsList";
import { ReviewsStats } from "./components/ReviewsStats";
import { reviewsSchema, TReviewsSchema } from "./reviewsZod";

const ReviewsComponent = () => {
  const router = useRouter();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const reviewsPerPage = 6;

  const { data: allReviewsData, isLoading: isLoadingAll } = useReviews(1, 10000);
  const allReviews = allReviewsData?.reviews || [];

  const {
    data: reviewsData,
    isLoading,
    isError,
    error,
  } = useReviews(currentPage, reviewsPerPage, starFilter || undefined);

  const reviews = reviewsData?.reviews || [];
  const totalPages = reviewsData?.totalPages || 0;
  const totalReviews = reviewsData?.total || 0;

  const createReviewMutation = useCreateReview();

  const form = useForm<TReviewsSchema>({
    resolver: zodResolver(reviewsSchema),
    defaultValues: {
      comment: "",
      rating: 0,
      name: "",
      email: "",
    },
  });

  const onSubmit = async (values: TReviewsSchema) => {
    setRateLimitError(null);
    try {
      await createReviewMutation.mutateAsync({
        rating: values.rating,
        comment: values.comment,
        name: values.name,
        email: values.email,
      });
      form.reset();
      setShowReviewForm(false);
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setRateLimitError("You've submitted too many reviews. Please try again later.");
      } else {
        setRateLimitError(
          err?.response?.data?.error || "Failed to submit review. Please try again.",
        );
      }
    }
  };

  const handleStarFilterChange = (filter: number | null) => {
    setStarFilter(filter);
    setCurrentPage(1);
  };

  return (
    <div className='min-h-screen bg-slate-950 text-white relative overflow-hidden'>
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000'></div>
      </div>

      <div className='relative z-10'>
        <div className='px-4 md:px-8 py-6'>
          <button
            onClick={() => router.push("/")}
            className='flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors group'
          >
            <ArrowLeft className='w-5 h-5 group-hover:-translate-x-1 transition-transform' />
            <span className='font-medium'>Back to Home</span>
          </button>
        </div>

        <div className='px-4 md:px-8 py-12 md:py-20'>
          <div className='max-w-5xl mx-auto'>
            <div className='flex items-center gap-3 mb-6 justify-center'>
              <h1 className='text-5xl md:text-7xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent'>
                Reviews
              </h1>
            </div>

            <p className='text-center text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto'>
              See what travelers are saying about their Wanderly experience
            </p>

            <ReviewsStats allReviews={allReviews} isLoading={isLoadingAll} />
          </div>
        </div>

        <div className='px-4 md:px-8 py-8'>
          <div className='max-w-4xl mx-auto'>
            {!showReviewForm ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className='w-full md:w-auto md:mx-auto md:block group relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl px-8 py-3 transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105'
              >
                <div className='flex items-center justify-center gap-2'>
                  <Send className='w-4 h-4 group-hover:rotate-12 transition-transform' />
                  <span className='text-base font-semibold'>Share Your Experience</span>
                </div>
              </button>
            ) : (
              <ReviewForm
                form={form}
                onSubmit={onSubmit}
                onCancel={() => setShowReviewForm(false)}
                isSubmitting={createReviewMutation.isPending}
                rateLimitError={rateLimitError}
              />
            )}
          </div>
        </div>

        <div className='px-4 md:px-8 py-16'>
          <div className='max-w-6xl mx-auto'>
            <h2 className='text-4xl font-bold mb-8 text-center'>
              What People Are Saying
            </h2>

            <ReviewsList
              reviews={reviews}
              isLoading={isLoading}
              isError={isError}
              error={error}
              starFilter={starFilter}
              onStarFilterChange={handleStarFilterChange}
              currentPage={currentPage}
              totalPages={totalPages}
              totalReviews={totalReviews}
              reviewsPerPage={reviewsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default ReviewsComponent;
```

- [ ] **Step 5: Verify line counts and types**

Run: `wc -l src/app/components/pages/Reviews/index.tsx src/app/components/pages/Reviews/components/*.tsx`
Expected: `index.tsx` is roughly 160 lines (down from 546); each new file is under 300 lines.

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 6: Manual verification in the browser**

Run: `npm run dev`, go to `/reviews`. Confirm: stats cards show correct average/total/5-star %; "Share Your Experience" opens the form; star rating picker and hover state work; submitting a review with a too-short comment shows the Zod error; submitting successfully closes the form and the new review appears; star filter buttons filter the list and reset to page 1; pagination controls work; rate-limit error (if triggered) displays.

- [ ] **Step 7: Commit**

```bash
git add src/app/components/pages/Reviews
git commit -m "refactor: split Reviews page into stats/form/list components"
```

---

### Task 3: Verification and PR

**Files:** None (verification + git operations only).

- [ ] **Step 1: Run the full verification suite**

Run: `npm run lint && npx tsc --noEmit && npm run test`
Expected: all green.

- [ ] **Step 2: Push and open the PR**

```bash
git push -u origin refactor/reviews-service-repo
gh pr create --base dev --head refactor/reviews-service-repo \
  --title "refactor: migrate Reviews to service/repository architecture" \
  --body "Migrates /api/reviews to the repository/service/route layering from CLAUDE.md, adds Zod validation on the GET query params (POST already validated via the existing shared reviewsSchema), and splits the 546-line Reviews page into ReviewsStats/ReviewForm/ReviewsList. Removes validation logic from services.ts that duplicated what Zod now enforces at the route boundary. Part of docs/superpowers/specs/2026-09-22-code-cleanup-design.md, Pass 1."
gh pr checks --watch
```

(If this branch was based on the Foundation branch rather than `dev` because Foundation hadn't merged yet, target the PR at that branch instead, and note the dependency in the PR description — same as the Profile PR.)

---

## Definition of Done

- [ ] `src/app/api/reviews/repository.ts`, `schemas.ts` exist; `services.ts` no longer imports `@/lib/prisma` or duplicates Zod's validation; `route.ts` is a thin wrapper using `handleApiError`.
- [ ] GET's query params are validated with Zod; POST continues to use the shared `reviewsSchema`.
- [ ] `services.test.ts` passes and covers both services' behavior (pagination math, rating filter, trimming/null-coalescing on create).
- [ ] `Reviews/index.tsx` is under ~300 lines; `ReviewsStats`, `ReviewForm`, `ReviewsList` each own one clear responsibility.
- [ ] Manually verified in the browser: stats, submit flow (success + validation error), star filter, pagination.
- [ ] PR open with the `checks` workflow green (once targeting a branch that triggers it).
