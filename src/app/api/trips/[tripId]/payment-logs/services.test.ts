import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";

const mockVerifyTripAccess = vi.fn();
const mockVerifyGuestTripAccess = vi.fn();
vi.mock("../../access", () => ({
  verifyTripAccess: (...a: unknown[]) => mockVerifyTripAccess(...a),
  verifyGuestTripAccess: (...a: unknown[]) => mockVerifyGuestTripAccess(...a),
}));

const mockList = vi.fn();
const mockFindExpense = vi.fn();
const mockCreateRow = vi.fn();
vi.mock("./repository", () => ({
  listPaymentLogsByTrip: (...a: unknown[]) => mockList(...a),
  findExpenseForPayment: (...a: unknown[]) => mockFindExpense(...a),
  createPaymentLogRow: (...a: unknown[]) => mockCreateRow(...a),
}));

const mockFindUserId = vi.fn();
vi.mock("../../repository", () => ({
  findUserIdByEmail: (...a: unknown[]) => mockFindUserId(...a),
}));

const mockNotify = vi.fn();
vi.mock("../../../notifications/services", () => ({
  createNotificationService: (...a: unknown[]) => mockNotify(...a),
}));

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const { createPaymentLogService, listPaymentLogsForGuestService, listPaymentLogsService } =
  await import("./services");

const token = { uid: "f1" } as DecodedIdToken;
const body = { expenseId: "e1", payerEmail: "a@x.com", payeeEmail: "b@x.com", amount: 50 };
const log = {
  id: "log-1",
  payer: { name: "Alice", email: "a@x.com" },
  expense: { description: "Dinner" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyTripAccess.mockResolvedValue({ trip: { id: "t1", groupId: "g1" }, user: { id: "u1" } });
  mockFindExpense.mockResolvedValue({ id: "e1", tripId: "t1", paymentMethod: "gcash" });
  mockFindUserId.mockImplementation(async (email: string) => ({ id: `id-${email}` }));
  mockCreateRow.mockResolvedValue(log);
  mockNotify.mockResolvedValue(undefined);
});

describe("list services", () => {
  it("member list checks trip access first", async () => {
    mockList.mockResolvedValue([{ id: "l" }]);

    expect(await listPaymentLogsService(token, "t1")).toEqual([{ id: "l" }]);
    expect(mockVerifyTripAccess).toHaveBeenCalledWith(token, "t1");
  });

  it("guest list re-verifies the group code against the trip", async () => {
    mockList.mockResolvedValue([]);

    await listPaymentLogsForGuestService("ABC123", "t1");

    expect(mockVerifyGuestTripAccess).toHaveBeenCalledWith("ABC123", "t1");
  });

  it("guest list does not query when verification fails", async () => {
    mockVerifyGuestTripAccess.mockRejectedValue(new NotFoundError("Trip not found"));

    await expect(listPaymentLogsForGuestService("X", "t1")).rejects.toThrow(NotFoundError);
    expect(mockList).not.toHaveBeenCalled();
  });
});

describe("createPaymentLogService", () => {
  it("rejects an expense from another trip", async () => {
    mockFindExpense.mockResolvedValue({ id: "e1", tripId: "other", paymentMethod: null });

    await expect(createPaymentLogService(token, "t1", body)).rejects.toThrow(ValidationError);
    expect(mockCreateRow).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when payer or payee email is unknown", async () => {
    mockFindUserId.mockResolvedValue(null);

    await expect(createPaymentLogService(token, "t1", body)).rejects.toThrow(NotFoundError);
  });

  it("falls back to the expense's method for cash or no method", async () => {
    await createPaymentLogService(token, "t1", { ...body, paymentMethod: "cash" });
    await createPaymentLogService(token, "t1", body);

    for (const call of mockCreateRow.mock.calls) {
      expect(call[0].paymentMethod).toBe("gcash");
    }
  });

  it("uses an explicit non-cash method and notifies the payee", async () => {
    await createPaymentLogService(token, "t1", { ...body, paymentMethod: "bank" });

    expect(mockCreateRow).toHaveBeenCalledWith(
      expect.objectContaining({ payerId: "id-a@x.com", payeeId: "id-b@x.com", paymentMethod: "bank" }),
    );
    expect(mockNotify).toHaveBeenCalledWith(
      "id-b@x.com",
      expect.objectContaining({ message: "Alice paid you ₱50.00 for Dinner", relatedGroupId: "g1" }),
    );
  });

  it("still returns the log when the notification fails", async () => {
    mockNotify.mockRejectedValue(new Error("boom"));

    await expect(createPaymentLogService(token, "t1", body)).resolves.toBe(log);
  });
});
