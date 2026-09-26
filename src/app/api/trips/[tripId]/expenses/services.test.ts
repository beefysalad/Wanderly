import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

const mockVerifyTripAccess = vi.fn();
const mockVerifyGuestTripAccess = vi.fn();
vi.mock("../../access", () => ({
  verifyTripAccess: (...a: unknown[]) => mockVerifyTripAccess(...a),
  verifyGuestTripAccess: (...a: unknown[]) => mockVerifyGuestTripAccess(...a),
}));

const mockFindUserIdByEmail = vi.fn();
vi.mock("../../repository", () => ({
  findUserIdByEmail: (...a: unknown[]) => mockFindUserIdByEmail(...a),
}));

const mockFindGroupOwnership = vi.fn();
vi.mock("../../../groups/repository", () => ({
  findGroupOwnership: (...a: unknown[]) => mockFindGroupOwnership(...a),
}));

const mockFindActivityById = vi.fn();
vi.mock("../activities/repository", () => ({
  findActivityById: (...a: unknown[]) => mockFindActivityById(...a),
}));

const mockList = vi.fn();
const mockFindById = vi.fn();
const mockFindSummary = vi.fn();
const mockCreateRow = vi.fn();
const mockUpdateRow = vi.fn();
const mockDeleteRow = vi.fn();
vi.mock("./repository", () => ({
  listExpensesByTrip: (...a: unknown[]) => mockList(...a),
  findExpenseById: (...a: unknown[]) => mockFindById(...a),
  findExpenseSummary: (...a: unknown[]) => mockFindSummary(...a),
  createExpenseRow: (...a: unknown[]) => mockCreateRow(...a),
  updateExpenseRow: (...a: unknown[]) => mockUpdateRow(...a),
  deleteExpenseRow: (...a: unknown[]) => mockDeleteRow(...a),
}));

const mockNotifyMembers = vi.fn();
vi.mock("../../../notifications/notifyMembers", () => ({
  notifyGroupMembers: (...a: unknown[]) => mockNotifyMembers(...a),
}));

const mockEmitCreated = vi.fn();
const mockEmitUpdated = vi.fn();
const mockEmitDeleted = vi.fn();
vi.mock("@/lib/socket-events", () => ({
  emitExpenseCreated: (...a: unknown[]) => mockEmitCreated(...a),
  emitExpenseUpdated: (...a: unknown[]) => mockEmitUpdated(...a),
  emitExpenseDeleted: (...a: unknown[]) => mockEmitDeleted(...a),
}));

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const {
  createExpenseService,
  deleteExpenseService,
  getExpenseByIdService,
  listExpensesForGuestService,
  updateExpenseService,
} = await import("./services");

const token = { uid: "f1" } as DecodedIdToken;
const user = { id: "u1", name: "Alice", email: "alice@x.com" };
const trip = { id: "t1", groupId: "g1", name: "Japan" };
const createBody = {
  paidBy: "alice@x.com",
  amount: 100,
  description: "Dinner",
  date: new Date("2026-10-01"),
  splitWith: ["bob@x.com", "Guest Gary", "ghost@x.com"],
};
const expenseRow = {
  id: "e1",
  amount: 100,
  date: new Date("2026-10-01"),
  paidBy: { id: "u1", email: "alice@x.com", name: "Alice" },
  tempPaidBy: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyTripAccess.mockResolvedValue({ trip, user });
  mockFindGroupOwnership.mockResolvedValue({ createdById: "owner-1", name: "Crew" });
  mockFindUserIdByEmail.mockImplementation(async (email: string) =>
    email === "ghost@x.com" ? null : { id: `id-${email}` },
  );
  mockNotifyMembers.mockResolvedValue(undefined);
  mockEmitCreated.mockResolvedValue(undefined);
  mockEmitUpdated.mockResolvedValue(undefined);
  mockEmitDeleted.mockResolvedValue(undefined);
});

describe("guest list", () => {
  it("re-verifies the group code before listing", async () => {
    mockList.mockResolvedValue([]);

    await listExpensesForGuestService("g1", "t1");

    expect(mockVerifyGuestTripAccess).toHaveBeenCalledWith("g1", "t1");
  });
});

describe("getExpenseByIdService", () => {
  it("hides expenses from other trips as not found", async () => {
    mockFindById.mockResolvedValue({ id: "e1", tripId: "other" });

    await expect(getExpenseByIdService(token, "t1", "e1")).rejects.toThrow(NotFoundError);
  });
});

describe("createExpenseService", () => {
  it("rejects an activity from another trip", async () => {
    mockFindActivityById.mockResolvedValue({ tripId: "other" });

    await expect(
      createExpenseService(token, "t1", { ...createBody, activityId: "a1" }),
    ).rejects.toThrow(ValidationError);
    expect(mockCreateRow).not.toHaveBeenCalled();
  });

  it("resolves emails to users and keeps unknown emails and free text as names", async () => {
    mockCreateRow.mockResolvedValue(expenseRow);

    await createExpenseService(token, "t1", createBody);

    expect(mockCreateRow).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: "g1",
        paidById: "id-alice@x.com",
        tempPaidBy: null,
        createdById: "u1",
        paymentMethod: null,
        splits: [
          { userId: "id-bob@x.com", tempName: null },
          { userId: null, tempName: "Guest Gary" },
          { userId: null, tempName: "ghost@x.com" },
        ],
      }),
    );
  });

  it("stores a guest payer by name, maps cash to null and other methods through", async () => {
    mockCreateRow.mockResolvedValue({ ...expenseRow, paidBy: null, tempPaidBy: "Gary" });

    await createExpenseService(token, "t1", { ...createBody, paidBy: "Gary", paymentMethod: "cash" });
    await createExpenseService(token, "t1", { ...createBody, paymentMethod: "gcash" });

    expect(mockCreateRow.mock.calls[0][0]).toMatchObject({ paidById: null, tempPaidBy: "Gary", paymentMethod: null });
    expect(mockCreateRow.mock.calls[1][0]).toMatchObject({ paymentMethod: "gcash" });
  });

  it("notifies others, and broadcasts a serialized expense with a guest paidBy fallback", async () => {
    mockCreateRow.mockResolvedValue({ ...expenseRow, paidBy: null, tempPaidBy: "Gary" });

    await createExpenseService(token, "t1", createBody);

    expect(mockNotifyMembers).toHaveBeenCalledWith(
      "g1",
      "u1",
      expect.objectContaining({ message: "Alice added expense 'Dinner' (₱100.00) to Japan" }),
    );
    expect(mockEmitCreated).toHaveBeenCalledWith(
      "g1",
      expect.objectContaining({
        amount: 100,
        date: "2026-10-01T00:00:00.000Z",
        paidBy: { id: "guest", name: "Gary", email: "" },
      }),
    );
  });
});

describe("updateExpenseService", () => {
  const before = { id: "e1", tripId: "t1", paidById: "u1", description: "Old", amount: 50 };

  beforeEach(() => {
    mockFindSummary.mockResolvedValue(before);
    mockUpdateRow.mockResolvedValue(expenseRow);
  });

  it("throws NotFoundError for an expense from another trip", async () => {
    mockFindSummary.mockResolvedValue({ ...before, tripId: "other" });

    await expect(updateExpenseService(token, "t1", "e1", { description: "x" })).rejects.toThrow(NotFoundError);
    expect(mockUpdateRow).not.toHaveBeenCalled();
  });

  it("can switch the payment method to cash (stored as null) and unlink the activity", async () => {
    await updateExpenseService(token, "t1", "e1", { paymentMethod: "cash", activityId: "" });

    expect(mockUpdateRow).toHaveBeenCalledWith("e1", { paymentMethod: null, activityId: null });
    expect(mockFindActivityById).not.toHaveBeenCalled();
  });

  it("replaces splits only when splitWith is provided (empty list clears them)", async () => {
    await updateExpenseService(token, "t1", "e1", { splitWith: [] });
    await updateExpenseService(token, "t1", "e1", { category: "food" });

    expect(mockUpdateRow.mock.calls[0][1]).toEqual({ splits: [] });
    expect(mockUpdateRow.mock.calls[1][1]).not.toHaveProperty("splits");
  });

  it("does not notify or emit for changes other than description/amount", async () => {
    await updateExpenseService(token, "t1", "e1", { category: "food" });

    expect(mockNotifyMembers).not.toHaveBeenCalled();
    expect(mockEmitUpdated).not.toHaveBeenCalled();
  });

  it("notifies with the pre-update description and amount on a significant change", async () => {
    await updateExpenseService(token, "t1", "e1", { amount: 75 });

    expect(mockNotifyMembers).toHaveBeenCalledWith(
      "g1",
      "u1",
      expect.objectContaining({ message: "Alice updated expense 'Old' (₱50.00) in Japan" }),
    );
    expect(mockEmitUpdated).toHaveBeenCalledTimes(1);
  });

  it("stays silent when the previous amount was zero", async () => {
    mockFindSummary.mockResolvedValue({ ...before, amount: 0 });

    await updateExpenseService(token, "t1", "e1", { description: "x" });

    expect(mockNotifyMembers).not.toHaveBeenCalled();
  });
});

describe("deleteExpenseService", () => {
  it("notifies before deleting, without relatedExpenseId, then emits", async () => {
    mockFindSummary.mockResolvedValue({
      id: "e1",
      tripId: "t1",
      description: "Dinner",
      amount: 100,
      createdById: "u1",
    });
    const order: string[] = [];
    mockNotifyMembers.mockImplementation(async () => void order.push("notify"));
    mockDeleteRow.mockImplementation(async () => void order.push("delete"));

    await deleteExpenseService(token, "t1", "e1");

    expect(order).toEqual(["notify", "delete"]);
    expect(mockNotifyMembers.mock.calls[0][2]).not.toHaveProperty("relatedExpenseId");
    expect(mockEmitDeleted).toHaveBeenCalledWith("g1", "e1", {
      deletedBy: "Alice",
      expenseDescription: "Dinner",
      tripId: "t1",
    });
  });

  it("throws NotFoundError when missing", async () => {
    mockFindSummary.mockResolvedValue(null);

    await expect(deleteExpenseService(token, "t1", "e1")).rejects.toThrow(NotFoundError);
    expect(mockDeleteRow).not.toHaveBeenCalled();
  });
});

describe("expense edit/delete permissions", () => {
  const summary = (over = {}) => ({
    id: "e1",
    tripId: "t1",
    paidById: "payer-1",
    createdById: "creator-1",
    description: "Dinner",
    amount: 100,
    ...over,
  });

  beforeEach(() => {
    mockUpdateRow.mockResolvedValue(expenseRow);
  });

  it("rejects update and delete by a member who is neither creator, payer nor owner", async () => {
    mockFindSummary.mockResolvedValue(summary());

    await expect(updateExpenseService(token, "t1", "e1", { description: "x" })).rejects.toThrow(
      ForbiddenError,
    );
    await expect(deleteExpenseService(token, "t1", "e1")).rejects.toThrow(ForbiddenError);
    expect(mockUpdateRow).not.toHaveBeenCalled();
    expect(mockDeleteRow).not.toHaveBeenCalled();
  });

  it("allows the creator, the payer and the group owner", async () => {
    for (const actor of ["creator-1", "payer-1", "owner-1"]) {
      mockVerifyTripAccess.mockResolvedValue({ trip, user: { ...user, id: actor } });
      mockFindSummary.mockResolvedValue(summary());

      await expect(
        updateExpenseService(token, "t1", "e1", { category: "food" }),
      ).resolves.toBeDefined();
    }
  });
});
