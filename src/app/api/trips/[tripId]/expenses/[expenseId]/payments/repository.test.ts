import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();
const mockCreateMany = vi.fn();
const mockDeleteMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  default: {
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        expensePayment: { findUnique: mockFindUnique, upsert: mockUpsert },
        paymentLog: { createMany: mockCreateMany, deleteMany: mockDeleteMany },
      }),
  },
}));

const { confirmPaymentAndLog, markPendingAndClearLog } = await import("./repository");

const log = { tripId: "t1", payeeId: "u-alice", amount: 30, paymentMethod: null };

beforeEach(() => vi.clearAllMocks());

describe("confirmPaymentAndLog", () => {
  it("always records the confirmed status", async () => {
    await confirmPaymentAndLog("e1", "u-bob", log);

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { expenseId_userId: { expenseId: "e1", userId: "u-bob" } },
      update: { status: "confirmed" },
      create: { expenseId: "e1", userId: "u-bob", status: "confirmed" },
    });
  });

  it("inserts the log with skipDuplicates so a concurrent confirm can't abort the transaction", async () => {
    await confirmPaymentAndLog("e1", "u-bob", log);

    expect(mockCreateMany).toHaveBeenCalledTimes(1);
    expect(mockCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ expenseId: "e1", payerId: "u-bob", payeeId: "u-alice" }),
        skipDuplicates: true,
      }),
    );
  });

  it("propagates a failed insert", async () => {
    mockCreateMany.mockRejectedValue(new Error("connection reset"));

    await expect(confirmPaymentAndLog("e1", "u-bob", log)).rejects.toThrow("connection reset");
  });

  it("skips the log entirely when the member isn't in the split", async () => {
    await confirmPaymentAndLog("e1", "u-bob", null);

    expect(mockCreateMany).not.toHaveBeenCalled();
  });
});

describe("markPendingAndClearLog", () => {
  it("marks the share pending and clears any leftover log", async () => {
    mockFindUnique.mockResolvedValue({ status: "rejected" });

    await markPendingAndClearLog("e1", "u-bob");

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { expenseId_userId: { expenseId: "e1", userId: "u-bob" } },
      create: { expenseId: "e1", userId: "u-bob", status: "pending" },
      update: { status: "pending" },
    });
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { expenseId: "e1", payerId: "u-bob" } });
  });

  it("creates the pending row when the share has none yet", async () => {
    mockFindUnique.mockResolvedValue(null);

    await markPendingAndClearLog("e1", "u-bob");

    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });

  it("leaves an already-confirmed share and its log untouched", async () => {
    mockFindUnique.mockResolvedValue({ status: "confirmed" });

    await markPendingAndClearLog("e1", "u-bob");

    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });
});
