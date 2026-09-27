import { describe, expect, it, vi } from "vitest";

const mockUpsert = vi.fn();
const mockFindFirst = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  default: {
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({
        expensePayment: { upsert: mockUpsert },
        paymentLog: { findFirst: mockFindFirst, create: mockCreate },
      }),
  },
}));

const { confirmPaymentAndLog } = await import("./repository");

const log = { tripId: "t1", payeeId: "u-alice", payeeName: null, amount: 30, paymentMethod: null };

describe("confirmPaymentAndLog", () => {
  it("always records the confirmed status", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({});

    await confirmPaymentAndLog("e1", "u-bob", log);

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { expenseId_userId: { expenseId: "e1", userId: "u-bob" } },
      update: { status: "confirmed" },
      create: { expenseId: "e1", userId: "u-bob", status: "confirmed" },
    });
  });

  it("creates the log when none exists yet", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({});

    await confirmPaymentAndLog("e1", "u-bob", log);

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("does not create a second log when one already exists", async () => {
    mockFindFirst.mockResolvedValue({ id: "log-1" });

    await confirmPaymentAndLog("e1", "u-bob", log);

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("swallows a unique-constraint violation from a concurrent confirm", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockRejectedValue(Object.assign(new Error("duplicate"), { code: "P2002" }));

    await expect(confirmPaymentAndLog("e1", "u-bob", log)).resolves.toBeUndefined();
  });

  it("re-throws an error that isn't a unique-constraint violation", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockRejectedValue(new Error("connection reset"));

    await expect(confirmPaymentAndLog("e1", "u-bob", log)).rejects.toThrow("connection reset");
  });

  it("skips the log entirely when the member isn't in the split", async () => {
    await confirmPaymentAndLog("e1", "u-bob", null);

    expect(mockFindFirst).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
