import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The auth wrapper is covered by lib/auth/with-auth.test.ts; here the route's own schema
// parsing and service wiring is under test, with a hand-built auth context.
vi.mock("@/src/lib/auth/with-auth", () => ({
  withAuth: (handler: unknown) => handler,
}));

const mockConfirmPaymentService = vi.fn();
vi.mock("../services", () => ({
  confirmPaymentService: (...a: unknown[]) => mockConfirmPaymentService(...a),
}));

vi.mock("../../../transformers", () => ({ transformExpense: (e: unknown) => e }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { POST } = (await import("./route")) as any;

const params = Promise.resolve({ tripId: "t1", expenseId: "e1" });
const auth = { decodedToken: { uid: "f1" } };

const postRequest = (body: string) =>
  new NextRequest("http://localhost/api/trips/t1/expenses/e1/payments/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

beforeEach(() => vi.clearAllMocks());

describe("POST .../payments/confirm", () => {
  it("returns 400 for a malformed JSON body", async () => {
    const res = await POST(postRequest("{not json"), auth, { params });

    expect(res.status).toBe(400);
    expect(mockConfirmPaymentService).not.toHaveBeenCalled();
  });

  it("returns 400 when the body fails schema validation (bad status value)", async () => {
    const res = await POST(
      postRequest(JSON.stringify({ memberEmail: "bob@x.com", status: "maybe" })),
      auth,
      { params },
    );

    expect(res.status).toBe(400);
    expect(mockConfirmPaymentService).not.toHaveBeenCalled();
  });

  it("returns 400 when memberEmail is missing", async () => {
    const res = await POST(postRequest(JSON.stringify({ status: "confirmed" })), auth, { params });

    expect(res.status).toBe(400);
  });

  it("confirms the payment and returns the updated expense on success", async () => {
    mockConfirmPaymentService.mockResolvedValue({ id: "e1", refreshed: true });
    const body = { memberEmail: "bob@x.com", status: "confirmed" };

    const res = await POST(postRequest(JSON.stringify(body)), auth, { params });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ expense: { id: "e1", refreshed: true } });
    expect(mockConfirmPaymentService).toHaveBeenCalledWith(auth.decodedToken, "t1", "e1", body);
  });

  it("maps a rejected confirmation to the error's own status (e.g. 403 from the payer-only check)", async () => {
    const { ForbiddenError } = await import("@/src/lib/errors");
    mockConfirmPaymentService.mockRejectedValue(new ForbiddenError("Only the payer can confirm or reject payments"));

    const res = await POST(
      postRequest(JSON.stringify({ memberEmail: "bob@x.com", status: "confirmed" })),
      auth,
      { params },
    );

    expect(res.status).toBe(403);
  });
});
