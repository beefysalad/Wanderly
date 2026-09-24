import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";

const mockVerifyTripAccess = vi.fn();
vi.mock("../../access", () => ({
  verifyTripAccess: (...a: unknown[]) => mockVerifyTripAccess(...a),
}));

const mockListBudgetsByTrip = vi.fn();
const mockFindBudgetById = vi.fn();
const mockFindActivityTripId = vi.fn();
const mockCreateBudgetRow = vi.fn();
const mockUpdateBudgetRow = vi.fn();
const mockDeleteBudgetRow = vi.fn();
vi.mock("./repository", () => ({
  listBudgetsByTrip: (...a: unknown[]) => mockListBudgetsByTrip(...a),
  findBudgetById: (...a: unknown[]) => mockFindBudgetById(...a),
  findActivityTripId: (...a: unknown[]) => mockFindActivityTripId(...a),
  createBudgetRow: (...a: unknown[]) => mockCreateBudgetRow(...a),
  updateBudgetRow: (...a: unknown[]) => mockUpdateBudgetRow(...a),
  deleteBudgetRow: (...a: unknown[]) => mockDeleteBudgetRow(...a),
}));

const {
  createBudgetService,
  deleteBudgetService,
  listBudgetsService,
  updateBudgetService,
} = await import("./services");

const token = { uid: "firebase-1" } as DecodedIdToken;

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyTripAccess.mockResolvedValue({ trip: { id: "trip-1", groupId: "group-1" }, user: { id: "user-1" } });
});

describe("listBudgetsService", () => {
  it("checks trip access, then returns the trip's budgets", async () => {
    mockListBudgetsByTrip.mockResolvedValue([{ id: "b1" }]);

    const result = await listBudgetsService(token, "trip-1");

    expect(mockVerifyTripAccess).toHaveBeenCalledWith(token, "trip-1");
    expect(mockListBudgetsByTrip).toHaveBeenCalledWith("trip-1");
    expect(result).toEqual([{ id: "b1" }]);
  });
});

describe("createBudgetService", () => {
  it("throws ValidationError when the activity belongs to a different trip", async () => {
    mockFindActivityTripId.mockResolvedValue({ tripId: "other-trip" });

    await expect(
      createBudgetService(token, "trip-1", { amount: 10, activityId: "act-1" }),
    ).rejects.toThrow(ValidationError);
    expect(mockCreateBudgetRow).not.toHaveBeenCalled();
  });

  it("applies defaults and turns an empty-string activityId into null without an activity lookup", async () => {
    mockCreateBudgetRow.mockResolvedValue({ id: "b1" });

    await createBudgetService(token, "trip-1", { amount: 10, category: "", activityId: "" });

    expect(mockFindActivityTripId).not.toHaveBeenCalled();
    expect(mockCreateBudgetRow).toHaveBeenCalledWith({
      tripId: "trip-1",
      amount: 10,
      description: null,
      category: null,
      activityId: null,
      isBooked: false,
    });
  });

  it("links a valid activity from the same trip", async () => {
    mockFindActivityTripId.mockResolvedValue({ tripId: "trip-1" });
    mockCreateBudgetRow.mockResolvedValue({ id: "b1" });

    await createBudgetService(token, "trip-1", {
      amount: 25,
      description: "Museum",
      activityId: "act-1",
      isBooked: true,
    });

    expect(mockCreateBudgetRow).toHaveBeenCalledWith({
      tripId: "trip-1",
      amount: 25,
      description: "Museum",
      category: null,
      activityId: "act-1",
      isBooked: true,
    });
  });
});

describe("updateBudgetService", () => {
  it("throws NotFoundError when the budget belongs to a different trip", async () => {
    mockFindBudgetById.mockResolvedValue({ id: "b1", tripId: "other-trip" });

    await expect(updateBudgetService(token, "trip-1", "b1", { isBooked: true })).rejects.toThrow(
      NotFoundError,
    );
    expect(mockUpdateBudgetRow).not.toHaveBeenCalled();
  });

  it("throws ValidationError when relinking to an activity from another trip", async () => {
    mockFindBudgetById.mockResolvedValue({ id: "b1", tripId: "trip-1" });
    mockFindActivityTripId.mockResolvedValue({ tripId: "other-trip" });

    await expect(
      updateBudgetService(token, "trip-1", "b1", { activityId: "act-9" }),
    ).rejects.toThrow(ValidationError);
    expect(mockUpdateBudgetRow).not.toHaveBeenCalled();
  });

  it("stores an empty-string activityId as null (unlink) instead of passing '' to the database", async () => {
    mockFindBudgetById.mockResolvedValue({ id: "b1", tripId: "trip-1" });
    mockUpdateBudgetRow.mockResolvedValue({ id: "b1" });

    await updateBudgetService(token, "trip-1", "b1", { activityId: "" });

    expect(mockFindActivityTripId).not.toHaveBeenCalled();
    expect(mockUpdateBudgetRow).toHaveBeenCalledWith("b1", { activityId: null });
  });

  it("passes only the fields that were provided", async () => {
    mockFindBudgetById.mockResolvedValue({ id: "b1", tripId: "trip-1" });
    mockUpdateBudgetRow.mockResolvedValue({ id: "b1" });

    await updateBudgetService(token, "trip-1", "b1", { amount: 99, isBooked: true });

    expect(mockUpdateBudgetRow).toHaveBeenCalledWith("b1", { amount: 99, isBooked: true });
  });
});

describe("deleteBudgetService", () => {
  it("throws NotFoundError when the budget doesn't exist", async () => {
    mockFindBudgetById.mockResolvedValue(null);

    await expect(deleteBudgetService(token, "trip-1", "b1")).rejects.toThrow(NotFoundError);
    expect(mockDeleteBudgetRow).not.toHaveBeenCalled();
  });

  it("deletes a budget that belongs to the trip", async () => {
    mockFindBudgetById.mockResolvedValue({ id: "b1", tripId: "trip-1" });

    await deleteBudgetService(token, "trip-1", "b1");

    expect(mockDeleteBudgetRow).toHaveBeenCalledWith("b1");
  });
});
