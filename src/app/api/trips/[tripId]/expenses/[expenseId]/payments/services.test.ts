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
const mockFindLog = vi.fn();
const mockDeleteLogs = vi.fn();
vi.mock("../../../payment-logs/repository", () => ({
  createPaymentLogRow: (...a: unknown[]) => mockCreatePaymentLogRow(...a),
  findPaymentLogForShare: (...a: unknown[]) => mockFindLog(...a),
  deletePaymentLogsForShare: (...a: unknown[]) => mockDeleteLogs(...a),
}));

const mockCreateNotification = vi.fn();
vi.mock("../../../../../notifications/services", () => ({
  createNotificationService: (...a: unknown[]) => mockCreateNotification(...a),
}));

const mockFindExpenseById = vi.fn();
vi.mock("../../repository", () => ({
  findExpenseById: (...a: unknown[]) => mockFindExpenseById(...a),
}));

const mockFindForPayments = vi.fn();
const mockUpsertPending = vi.fn();
const mockDeletePayments = vi.fn();
const mockUpsertStatus = vi.fn();
vi.mock("./repository", () => ({
  findExpenseForPayments: (...a: unknown[]) => mockFindForPayments(...a),
  upsertPendingPayment: (...a: unknown[]) => mockUpsertPending(...a),
  deletePaymentsForMember: (...a: unknown[]) => mockDeletePayments(...a),
  upsertPaymentStatus: (...a: unknown[]) => mockUpsertStatus(...a),
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
  splits: [{ user: alice }, { user: bob }, { user: { id: "u-c", email: "c@x.com" } }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: bob });
  mockFindForPayments.mockResolvedValue(expense);
  mockFindUserIdByEmail.mockImplementation(async (email: string) => ({ id: `id-${email}` }));
  mockFindExpenseById.mockResolvedValue({ id: "e1", refreshed: true });
  mockFindGroupOwnership.mockResolvedValue({ createdById: "owner-1", name: "Crew" });
  mockFindLog.mockResolvedValue(null);
  mockCreateNotification.mockResolvedValue(undefined);
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

  it("creates a pending payment and writes no payment log until the payer confirms", async () => {
    const result = await markExpensePaidService(token, "t1", "e1", paid);

    expect(mockUpsertPending).toHaveBeenCalledWith("e1", "id-bob@x.com");
    expect(mockCreatePaymentLogRow).not.toHaveBeenCalled();
    expect(result).toEqual({ id: "e1", refreshed: true });
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
  const confirm = { memberEmail: "bob@x.com", status: "confirmed" as const };
  const reject = { memberEmail: "bob@x.com", status: "rejected" as const };

  beforeEach(() => {
    mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: alice });
  });

  it("only lets the payer confirm or reject", async () => {
    mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: bob });

    await expect(confirmPaymentService(token, "t1", "e1", confirm)).rejects.toThrow(ForbiddenError);
    expect(mockUpsertStatus).not.toHaveBeenCalled();
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("rejects an expense from another trip", async () => {
    mockFindForPayments.mockResolvedValue({ ...expense, tripId: "other" });

    await expect(confirmPaymentService(token, "t1", "e1", confirm)).rejects.toThrow(NotFoundError);
  });

  it("confirming records the status, logs the member's share to the payer and notifies them", async () => {
    const result = await confirmPaymentService(token, "t1", "e1", confirm);

    expect(mockUpsertStatus).toHaveBeenCalledWith("e1", "id-bob@x.com", "confirmed");
    expect(mockCreatePaymentLogRow).toHaveBeenCalledWith({
      tripId: "t1",
      expenseId: "e1",
      payerId: "id-bob@x.com",
      payeeId: "u-alice",
      amount: 30,
      paymentMethod: "gcash",
    });
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

  it("does not log a share twice", async () => {
    mockFindLog.mockResolvedValue({ id: "log-1" });

    await confirmPaymentService(token, "t1", "e1", confirm);

    expect(mockCreatePaymentLogRow).not.toHaveBeenCalled();
  });

  it("rejecting notifies the member and removes any log left for that share", async () => {
    await confirmPaymentService(token, "t1", "e1", reject);

    expect(mockUpsertStatus).toHaveBeenCalledWith("e1", "id-bob@x.com", "rejected");
    expect(mockDeleteLogs).toHaveBeenCalledWith("e1", "id-bob@x.com");
    expect(mockCreatePaymentLogRow).not.toHaveBeenCalled();
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

  it("does not divide by zero when an expense has no splits", async () => {
    mockFindForPayments.mockResolvedValue({ ...expense, splits: [] });

    await confirmPaymentService(token, "t1", "e1", confirm);

    expect(mockCreatePaymentLogRow).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for an unknown member", async () => {
    mockFindUserIdByEmail.mockResolvedValue(null);

    await expect(
      confirmPaymentService(token, "t1", "e1", { memberEmail: "ghost@x.com", status: "confirmed" }),
    ).rejects.toThrow(NotFoundError);
  });
});
