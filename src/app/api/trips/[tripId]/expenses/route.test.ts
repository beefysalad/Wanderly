import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The route's own logic (schema parsing, guest gating, service wiring) is what's under test
// here, not the auth wrapper itself (covered by lib/auth/with-auth.test.ts) — so it's replaced
// with identity, and the handler is called directly with a hand-built context.
vi.mock("@/lib/auth/with-auth", () => ({
  withOptionalAuth: (handler: unknown) => handler,
}));

const mockCreateExpenseService = vi.fn();
const mockListExpensesService = vi.fn();
const mockListExpensesForGuestService = vi.fn();
vi.mock("./services", () => ({
  createExpenseService: (...a: unknown[]) => mockCreateExpenseService(...a),
  listExpensesService: (...a: unknown[]) => mockListExpensesService(...a),
  listExpensesForGuestService: (...a: unknown[]) => mockListExpensesForGuestService(...a),
}));

vi.mock("./transformers", () => ({ transformExpense: (e: unknown) => e }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { GET, POST } = (await import("./route")) as any;

const params = Promise.resolve({ tripId: "t1" });
const memberContext = { decodedToken: { uid: "f1" }, isGuest: false };
const guestContext = { decodedToken: null, isGuest: true, guestGroupId: "g1" };

const postRequest = (body: string) =>
  new NextRequest("http://localhost/api/trips/t1/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

const validBody = {
  paidBy: "alice@x.com",
  amount: 10,
  description: "Coffee",
  date: "2026-10-01",
  splitWith: ["alice@x.com"],
};

beforeEach(() => vi.clearAllMocks());

describe("POST /api/trips/[tripId]/expenses", () => {
  it("returns 400 for a malformed JSON body", async () => {
    const res = await POST(postRequest("{not json"), memberContext, { params });

    expect(res.status).toBe(400);
    expect(mockCreateExpenseService).not.toHaveBeenCalled();
  });

  it("returns 400 when the body fails schema validation", async () => {
    const res = await POST(postRequest(JSON.stringify({ amount: -5 })), memberContext, { params });

    expect(res.status).toBe(400);
    expect(mockCreateExpenseService).not.toHaveBeenCalled();
  });

  it("returns 403 when a guest tries to create an expense", async () => {
    const res = await POST(postRequest(JSON.stringify(validBody)), guestContext, { params });

    expect(res.status).toBe(403);
    expect(mockCreateExpenseService).not.toHaveBeenCalled();
  });

  it("creates the expense and returns 201 on success", async () => {
    mockCreateExpenseService.mockResolvedValue({ id: "e1" });

    const res = await POST(postRequest(JSON.stringify(validBody)), memberContext, { params });
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json).toEqual({ expense: { id: "e1" } });
    // date is coerced to a real Date by the schema, so compare the rest and the date separately.
    expect(mockCreateExpenseService).toHaveBeenCalledWith(
      memberContext.decodedToken,
      "t1",
      expect.objectContaining({ ...validBody, date: new Date(validBody.date) }),
    );
  });
});

describe("GET /api/trips/[tripId]/expenses", () => {
  it("lists via the guest service for a guest, and the member service for a signed-in user", async () => {
    mockListExpensesForGuestService.mockResolvedValue([{ id: "guest-e1" }]);
    mockListExpensesService.mockResolvedValue([{ id: "member-e1" }]);
    const req = new NextRequest("http://localhost/api/trips/t1/expenses");

    const guestRes = await GET(req, guestContext, { params });
    expect(await guestRes.json()).toEqual({ expenses: [{ id: "guest-e1" }] });
    expect(mockListExpensesForGuestService).toHaveBeenCalledWith("g1", "t1");

    const memberRes = await GET(req, memberContext, { params });
    expect(await memberRes.json()).toEqual({ expenses: [{ id: "member-e1" }] });
    expect(mockListExpensesService).toHaveBeenCalledWith(memberContext.decodedToken, "t1");
  });
});
