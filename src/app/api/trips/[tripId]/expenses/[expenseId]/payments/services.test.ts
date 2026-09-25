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

const mockCreatePaymentLogRow = vi.fn();
vi.mock("../../../payment-logs/repository", () => ({
  createPaymentLogRow: (...a: unknown[]) => mockCreatePaymentLogRow(...a),
}));

const mockFindExpenseById = vi.fn();
vi.mock("../../repository", () => ({
  findExpenseById: (...a: unknown[]) => mockFindExpenseById(...a),
}));

const mockFindForPayments = vi.fn();
const mockUpsertPending = vi.fn();
const mockDeletePayments = vi.fn();
const mockUpdateStatus = vi.fn();
vi.mock("./repository", () => ({
  findExpenseForPayments: (...a: unknown[]) => mockFindForPayments(...a),
  upsertPendingPayment: (...a: unknown[]) => mockUpsertPending(...a),
  deletePaymentsForMember: (...a: unknown[]) => mockDeletePayments(...a),
  updatePaymentStatus: (...a: unknown[]) => mockUpdateStatus(...a),
}));

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const { confirmPaymentService, markExpensePaidService } = await import("./services");

const token = { uid: "f1" } as DecodedIdToken;
const bob = { id: "u-bob", email: "bob@x.com" };
const alice = { id: "u-alice", email: "alice@x.com" };
const expense = {
  id: "e1",
  tripId: "t1",
  amount: 90,
  paymentMethod: "gcash",
  paidById: "u-alice",
  paidBy: alice,
  splits: [{ user: alice }, { user: bob }, { user: { id: "u-c", email: "c@x.com" } }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: bob });
  mockFindForPayments.mockResolvedValue(expense);
  mockFindUserIdByEmail.mockImplementation(async (email: string) => ({ id: `id-${email}` }));
  mockFindExpenseById.mockResolvedValue({ id: "e1", refreshed: true });
  mockFindGroupOwnership.mockResolvedValue({ createdById: "owner-1", name: "Crew" });
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
    expect(mockUpsertPending).not.toHaveBeenCalled();
  });

  it("only lets members mark themselves as paid", async () => {
    mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: alice });

    await expect(markExpensePaidService(token, "t1", "e1", paid)).rejects.toThrow(ForbiddenError);
    expect(mockUpsertPending).not.toHaveBeenCalled();
  });

  it("creates a pending payment and, by default, a payment log for an equal share", async () => {
    const result = await markExpensePaidService(token, "t1", "e1", paid);

    expect(mockUpsertPending).toHaveBeenCalledWith("e1", "id-bob@x.com");
    expect(mockCreatePaymentLogRow).toHaveBeenCalledWith({
      tripId: "t1",
      expenseId: "e1",
      payerId: "id-bob@x.com",
      payeeId: "u-alice",
      amount: 30,
      paymentMethod: "gcash",
    });
    expect(result).toEqual({ id: "e1", refreshed: true });
  });

  it("skips the payment log when createPaymentLog is false", async () => {
    await markExpensePaidService(token, "t1", "e1", { ...paid, createPaymentLog: false });

    expect(mockUpsertPending).toHaveBeenCalled();
    expect(mockCreatePaymentLogRow).not.toHaveBeenCalled();
  });

  it("skips the payment log for a guest payer (no paidById)", async () => {
    mockFindForPayments.mockResolvedValue({ ...expense, paidById: null });

    await markExpensePaidService(token, "t1", "e1", paid);

    expect(mockCreatePaymentLogRow).not.toHaveBeenCalled();
  });

  it("does not let a member un-mark someone else's payment", async () => {
    // the caller is bob; the payment being removed is cara's
    await expect(
      markExpensePaidService(token, "t1", "e1", { memberEmail: "c@x.com", isPaid: false }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockDeletePayments).not.toHaveBeenCalled();
  });

  it("lets the group owner un-mark anyone's payment", async () => {
    mockVerifyTripAccess.mockResolvedValue({
      trip: { id: "t1", groupId: "g1" },
      user: { id: "owner-1", email: "owner@x.com" },
    });

    await markExpensePaidService(token, "t1", "e1", { memberEmail: "c@x.com", isPaid: false });

    expect(mockDeletePayments).toHaveBeenCalled();
  });

  it("unmarking deletes the member's payment and creates no log", async () => {
    await markExpensePaidService(token, "t1", "e1", { memberEmail: "bob@x.com", isPaid: false });

    expect(mockDeletePayments).toHaveBeenCalledWith("e1", "id-bob@x.com");
    expect(mockUpsertPending).not.toHaveBeenCalled();
    expect(mockCreatePaymentLogRow).not.toHaveBeenCalled();
  });
});

describe("confirmPaymentService", () => {
  beforeEach(() => {
    mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: alice });
  });

  it("only lets the payer confirm or reject", async () => {
    mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: bob });

    await expect(
      confirmPaymentService(token, "t1", "e1", { memberEmail: "bob@x.com", status: "confirmed" }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it("confirming updates the status and logs the member's share to the payer", async () => {
    await confirmPaymentService(token, "t1", "e1", { memberEmail: "bob@x.com", status: "confirmed" });

    expect(mockUpdateStatus).toHaveBeenCalledWith("e1", "id-bob@x.com", "confirmed");
    expect(mockCreatePaymentLogRow).toHaveBeenCalledWith(
      expect.objectContaining({ payerId: "id-bob@x.com", payeeId: "u-alice", amount: 30 }),
    );
  });

  it("rejecting updates the status without a payment log", async () => {
    await confirmPaymentService(token, "t1", "e1", { memberEmail: "bob@x.com", status: "rejected" });

    expect(mockUpdateStatus).toHaveBeenCalledWith("e1", "id-bob@x.com", "rejected");
    expect(mockCreatePaymentLogRow).not.toHaveBeenCalled();
  });

  it("does not divide by zero when an expense has no splits", async () => {
    mockFindForPayments.mockResolvedValue({ ...expense, splits: [] });

    await confirmPaymentService(token, "t1", "e1", { memberEmail: "bob@x.com", status: "confirmed" });

    expect(mockCreatePaymentLogRow).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for an unknown member", async () => {
    mockFindUserIdByEmail.mockResolvedValue(null);

    await expect(
      confirmPaymentService(token, "t1", "e1", { memberEmail: "ghost@x.com", status: "confirmed" }),
    ).rejects.toThrow(NotFoundError);
  });
});
