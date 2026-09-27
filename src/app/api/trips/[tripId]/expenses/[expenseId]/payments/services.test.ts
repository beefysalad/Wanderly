import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

const mockVerifyTripAccess = vi.fn();
vi.mock("../../../../access", () => ({
  verifyTripAccess: (...a: unknown[]) => mockVerifyTripAccess(...a),
}));

const mockFindUserIdByEmail = vi.fn();
vi.mock("../../../../repository", () => ({
  findUserIdByEmail: (...a: unknown[]) => mockFindUserIdByEmail(...a),
}));

const mockFindGroupOwnership = vi.fn();
vi.mock("../../../../../groups/repository", () => ({
  findGroupOwnership: (...a: unknown[]) => mockFindGroupOwnership(...a),
}));

const mockCreateNotification = vi.fn();
vi.mock("../../../../../notifications/services", () => ({
  createNotificationService: (...a: unknown[]) => mockCreateNotification(...a),
}));

const mockEmitUpdated = vi.fn();
vi.mock("@/lib/socket-events", () => ({
  emitExpenseUpdated: (...a: unknown[]) => mockEmitUpdated(...a),
}));

// splitShareCents stays real (centavo-precision tests below depend on it); toSocketExpense
// is stubbed to identity so the placeholder findExpenseById fixtures below don't need a
// full Expense shape just to survive its date/paidBy serialization.
vi.mock("../../transformers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../transformers")>();
  return { ...actual, toSocketExpense: (expense: unknown) => expense };
});

const mockFindExpenseById = vi.fn();
vi.mock("../../repository", () => ({
  findExpenseById: (...a: unknown[]) => mockFindExpenseById(...a),
}));

const mockFindForPayments = vi.fn();
const mockMarkPendingAndClearLog = vi.fn();
const mockUnmarkPayment = vi.fn();
const mockConfirmPaymentAndLog = vi.fn();
const mockRejectPaymentAndClearLog = vi.fn();
const mockRecordGuestPayment = vi.fn();
const mockUnrecordGuestPayment = vi.fn();
vi.mock("./repository", () => ({
  findExpenseForPayments: (...a: unknown[]) => mockFindForPayments(...a),
  markPendingAndClearLog: (...a: unknown[]) => mockMarkPendingAndClearLog(...a),
  unmarkPayment: (...a: unknown[]) => mockUnmarkPayment(...a),
  confirmPaymentAndLog: (...a: unknown[]) => mockConfirmPaymentAndLog(...a),
  rejectPaymentAndClearLog: (...a: unknown[]) => mockRejectPaymentAndClearLog(...a),
  recordGuestPayment: (...a: unknown[]) => mockRecordGuestPayment(...a),
  unrecordGuestPayment: (...a: unknown[]) => mockUnrecordGuestPayment(...a),
}));

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const { confirmPaymentService, markExpensePaidService } = await import("./services");

const token = { uid: "f1" } as DecodedIdToken;
const bob = { id: "u-bob", email: "bob@x.com" };
const alice = { id: "u-alice", email: "alice@x.com", name: "Alice" };
const expense = {
  id: "e1",
  tripId: "t1",
  amount: 90,
  paymentMethod: "gcash",
  description: "Dinner",
  paidById: "u-alice",
  paidBy: alice,
  tempPaidBy: null,
  createdById: "u-creator",
  splits: [{ user: alice }, { user: bob }, { user: { id: "u-c", email: "c@x.com" } }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: bob });
  mockFindForPayments.mockResolvedValue(expense);
  mockFindUserIdByEmail.mockImplementation(async (email: string) => ({ id: `id-${email}` }));
  mockFindExpenseById.mockResolvedValue({ id: "e1", refreshed: true });
  mockFindGroupOwnership.mockResolvedValue({ createdById: "owner-1", name: "Crew" });
  mockCreateNotification.mockResolvedValue(undefined);
  mockEmitUpdated.mockResolvedValue(undefined);
});

describe("markExpensePaidService", () => {
  const paid = { memberEmail: "bob@x.com", isPaid: true };

  it("rejects an expense from another trip", async () => {
    mockFindForPayments.mockResolvedValue({ ...expense, tripId: "other" });

    await expect(markExpensePaidService(token, "t1", "e1", paid)).rejects.toThrow(NotFoundError);
  });

  it("rejects a member who isn't in the split", async () => {
    await expect(
      markExpensePaidService(token, "t1", "e1", { ...paid, memberEmail: "stranger@x.com" }),
    ).rejects.toThrow(NotFoundError);
    expect(mockMarkPendingAndClearLog).not.toHaveBeenCalled();
  });

  it("only lets members mark themselves as paid", async () => {
    mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: alice });

    await expect(markExpensePaidService(token, "t1", "e1", paid)).rejects.toThrow(ForbiddenError);
    expect(mockMarkPendingAndClearLog).not.toHaveBeenCalled();
  });

  it("marks the share pending, clears any stale log in one step, and broadcasts the change", async () => {
    const result = await markExpensePaidService(token, "t1", "e1", paid);

    expect(mockMarkPendingAndClearLog).toHaveBeenCalledWith("e1", "u-bob");
    expect(mockEmitUpdated).toHaveBeenCalledWith("g1", { id: "e1", refreshed: true }, { updatedBy: "bob@x.com" });
    expect(result).toEqual({ id: "e1", refreshed: true });
  });

  it("does not let a member un-mark someone else's payment", async () => {
    // the caller is bob; the payment being removed is cara's
    await expect(
      markExpensePaidService(token, "t1", "e1", { memberEmail: "c@x.com", isPaid: false }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockUnmarkPayment).not.toHaveBeenCalled();
  });

  it("lets the group owner un-mark anyone's payment", async () => {
    mockVerifyTripAccess.mockResolvedValue({
      trip: { id: "t1", groupId: "g1" },
      user: { id: "owner-1", email: "owner@x.com" },
    });

    await markExpensePaidService(token, "t1", "e1", { memberEmail: "c@x.com", isPaid: false });

    expect(mockUnmarkPayment).toHaveBeenCalled();
  });

  it("unmarking removes the member's payment and any log left from a previous confirm in one step", async () => {
    await markExpensePaidService(token, "t1", "e1", { memberEmail: "bob@x.com", isPaid: false });

    expect(mockUnmarkPayment).toHaveBeenCalledWith("e1", "u-bob");
    expect(mockMarkPendingAndClearLog).not.toHaveBeenCalled();
  });

  describe("a guest split member", () => {
    const guestExpense = {
      ...expense,
      splits: [...expense.splits, { user: null, tempName: "Guest Gary" }],
    };
    const paidGary = { memberEmail: "Guest Gary", isPaid: true };

    beforeEach(() => {
      mockFindForPayments.mockResolvedValue(guestExpense);
    });

    it("lets the payer record a guest's payment directly, as confirmed", async () => {
      mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: alice });

      const result = await markExpensePaidService(token, "t1", "e1", paidGary);

      expect(mockRecordGuestPayment).toHaveBeenCalledWith("e1", "Guest Gary", {
        tripId: "t1",
        payeeId: "u-alice",
        payeeName: null,
        amount: expect.any(Number),
        paymentMethod: "gcash",
      });
      expect(result).toEqual({ id: "e1", refreshed: true });
    });

    it("lets the creator record a guest's payment directly", async () => {
      mockVerifyTripAccess.mockResolvedValue({
        trip: { id: "t1", groupId: "g1" },
        user: { id: "u-creator", email: "creator@x.com" },
      });

      await markExpensePaidService(token, "t1", "e1", paidGary);

      expect(mockRecordGuestPayment).toHaveBeenCalled();
    });

    it("does not let another split member record a guest's payment", async () => {
      // bob (default caller) is neither the creator nor the payer
      await expect(markExpensePaidService(token, "t1", "e1", paidGary)).rejects.toThrow(ForbiddenError);
      expect(mockRecordGuestPayment).not.toHaveBeenCalled();
    });

    it("lets the payer reverse a recorded guest payment", async () => {
      mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: alice });

      await markExpensePaidService(token, "t1", "e1", { memberEmail: "Guest Gary", isPaid: false });

      expect(mockUnrecordGuestPayment).toHaveBeenCalledWith("e1", "Guest Gary");
    });
  });
});

describe("confirmPaymentService", () => {
  const confirm = { memberEmail: "bob@x.com", status: "confirmed" as const };
  const reject = { memberEmail: "bob@x.com", status: "rejected" as const };

  beforeEach(() => {
    mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: alice });
  });

  it("only lets the payer confirm or reject", async () => {
    mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: bob });

    await expect(confirmPaymentService(token, "t1", "e1", confirm)).rejects.toThrow(ForbiddenError);
    expect(mockConfirmPaymentAndLog).not.toHaveBeenCalled();
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("rejects an expense from another trip", async () => {
    mockFindForPayments.mockResolvedValue({ ...expense, tripId: "other" });

    await expect(confirmPaymentService(token, "t1", "e1", confirm)).rejects.toThrow(NotFoundError);
  });

  it("confirming records the status, logs the member's share to the payer, notifies them, and broadcasts the change", async () => {
    const result = await confirmPaymentService(token, "t1", "e1", confirm);

    expect(mockConfirmPaymentAndLog).toHaveBeenCalledWith("e1", "id-bob@x.com", {
      tripId: "t1",
      payeeId: "u-alice",
      payeeName: null,
      amount: 30,
      paymentMethod: "gcash",
    });
    expect(mockEmitUpdated).toHaveBeenCalledWith("g1", { id: "e1", refreshed: true }, { updatedBy: "Alice" });
    expect(mockCreateNotification).toHaveBeenCalledWith(
      "id-bob@x.com",
      expect.objectContaining({
        title: "Payment Confirmed",
        message: "Alice confirmed your payment for 'Dinner'",
        relatedGroupId: "g1",
        relatedExpenseId: "e1",
      }),
    );
    expect(result).toEqual({ id: "e1", refreshed: true });
  });

  it("logs the member's share to the centavo, with the leftover centavo on the payer", async () => {
    mockFindForPayments.mockResolvedValue({ ...expense, amount: 100 });

    await confirmPaymentService(token, "t1", "e1", confirm);

    expect(mockConfirmPaymentAndLog).toHaveBeenCalledWith(
      "e1",
      "id-bob@x.com",
      expect.objectContaining({ amount: 33.33 }),
    );
  });

  it("logs the leftover centavo on the first person in the split when the payer isn't in it", async () => {
    mockFindForPayments.mockResolvedValue({
      ...expense,
      amount: 100,
      splits: [{ user: bob }, { user: { id: "u-c", email: "c@x.com" } }, { user: null, tempName: "Guest Gary" }],
    });

    await confirmPaymentService(token, "t1", "e1", confirm);

    expect(mockConfirmPaymentAndLog).toHaveBeenCalledWith(
      "e1",
      "id-bob@x.com",
      expect.objectContaining({ amount: 33.34 }),
    );
  });

  it("records the status but logs nothing for a member who isn't in the split", async () => {
    await confirmPaymentService(token, "t1", "e1", { memberEmail: "dan@x.com", status: "confirmed" });

    expect(mockConfirmPaymentAndLog).toHaveBeenCalledWith("e1", "id-dan@x.com", null);
  });

  it("rejecting notifies the member and removes any log left for that share", async () => {
    await confirmPaymentService(token, "t1", "e1", reject);

    expect(mockRejectPaymentAndClearLog).toHaveBeenCalledWith("e1", "id-bob@x.com");
    expect(mockConfirmPaymentAndLog).not.toHaveBeenCalled();
    expect(mockCreateNotification).toHaveBeenCalledWith(
      "id-bob@x.com",
      expect.objectContaining({ title: "Payment Rejected" }),
    );
  });

  it("still succeeds when the notification fails", async () => {
    mockCreateNotification.mockRejectedValue(new Error("boom"));

    await expect(confirmPaymentService(token, "t1", "e1", confirm)).resolves.toEqual({
      id: "e1",
      refreshed: true,
    });
  });

  it("logs nothing when an expense has no splits", async () => {
    mockFindForPayments.mockResolvedValue({ ...expense, splits: [] });

    await confirmPaymentService(token, "t1", "e1", confirm);

    expect(mockConfirmPaymentAndLog).toHaveBeenCalledWith("e1", "id-bob@x.com", null);
  });

  it("throws NotFoundError for an unknown member", async () => {
    mockFindUserIdByEmail.mockResolvedValue(null);

    await expect(
      confirmPaymentService(token, "t1", "e1", { memberEmail: "ghost@x.com", status: "confirmed" }),
    ).rejects.toThrow(NotFoundError);
  });

  describe("when the payer is a guest", () => {
    const guestPayerExpense = {
      ...expense,
      paidById: null,
      paidBy: null,
      tempPaidBy: "Guest Payer",
    };

    beforeEach(() => {
      mockFindForPayments.mockResolvedValue(guestPayerExpense);
    });

    it("lets the creator confirm on the guest payer's behalf", async () => {
      mockVerifyTripAccess.mockResolvedValue({
        trip: { id: "t1", groupId: "g1" },
        user: { id: "u-creator", email: "creator@x.com", name: "Creator" },
      });

      await confirmPaymentService(token, "t1", "e1", confirm);

      expect(mockConfirmPaymentAndLog).toHaveBeenCalledWith(
        "e1",
        "id-bob@x.com",
        expect.objectContaining({ payeeId: null, payeeName: "Guest Payer" }),
      );
    });

    it("does not let a non-creator confirm on the guest payer's behalf", async () => {
      await expect(confirmPaymentService(token, "t1", "e1", confirm)).rejects.toThrow(ForbiddenError);
    });
  });
});
