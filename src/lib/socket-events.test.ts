import { Decimal } from "@prisma/client/runtime/library";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAfter = vi.fn((cb: () => unknown) => cb());
vi.mock("next/server", () => ({ after: (cb: () => unknown) => mockAfter(cb) }));

const mockLoggerError = vi.fn();
vi.mock("./logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: (...a: unknown[]) => mockLoggerError(...a) },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const ORIGINAL_ENV = { ...process.env };

// SOCKET_API_KEY/SOCKET_SERVER_URL are read once at module top level, so each test needs a
// fresh module after setting env vars.
async function loadModule() {
  vi.resetModules();
  return import("./socket-events");
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.SOCKET_API_KEY;
  delete process.env.SOCKET_SERVER_URL;
  delete process.env.NEXT_PUBLIC_SOCKET_URL;
});

describe("emitEvent (fail-closed config, via emitTripCreated)", () => {
  it("skips the request and logs when SOCKET_API_KEY is unset", async () => {
    process.env.SOCKET_SERVER_URL = "https://socket.test";
    const { emitTripCreated } = await loadModule();

    await emitTripCreated("g1", { id: "t1" });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.stringContaining("not configured"),
      expect.objectContaining({ endpoint: "trip/created" }),
    );
  });

  it("skips the request when neither socket URL env var is set", async () => {
    process.env.SOCKET_API_KEY = "key";
    const { emitTripCreated } = await loadModule();

    await emitTripCreated("g1", { id: "t1" });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("prefers SOCKET_SERVER_URL over NEXT_PUBLIC_SOCKET_URL when both are set", async () => {
    process.env.SOCKET_API_KEY = "key";
    process.env.SOCKET_SERVER_URL = "https://private.test";
    process.env.NEXT_PUBLIC_SOCKET_URL = "https://public.test";
    mockFetch.mockResolvedValue({ ok: true });
    const { emitTripCreated } = await loadModule();

    await emitTripCreated("g1", { id: "t1" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://private.test/api/events/trip/created",
      expect.anything(),
    );
  });

  it("falls back to NEXT_PUBLIC_SOCKET_URL when no private URL is set", async () => {
    process.env.SOCKET_API_KEY = "key";
    process.env.NEXT_PUBLIC_SOCKET_URL = "https://public.test";
    mockFetch.mockResolvedValue({ ok: true });
    const { emitTripCreated } = await loadModule();

    await emitTripCreated("g1", { id: "t1" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://public.test/api/events/trip/created",
      expect.anything(),
    );
  });

  it("sends the api key header and JSON body, deferred via after()", async () => {
    process.env.SOCKET_API_KEY = "secret-key";
    process.env.SOCKET_SERVER_URL = "https://socket.test";
    mockFetch.mockResolvedValue({ ok: true });
    const { emitTripCreated } = await loadModule();

    await emitTripCreated("g1", { id: "t1", name: "Japan" });

    expect(mockAfter).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("https://socket.test/api/events/trip/created", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "secret-key" },
      body: JSON.stringify({ groupId: "g1", trip: { id: "t1", name: "Japan" } }),
      signal: expect.any(AbortSignal),
    });
  });

  it("logs but does not throw when the socket server responds with an error status", async () => {
    process.env.SOCKET_API_KEY = "key";
    process.env.SOCKET_SERVER_URL = "https://socket.test";
    mockFetch.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve("boom") });
    const { emitTripCreated } = await loadModule();

    await expect(emitTripCreated("g1", { id: "t1" })).resolves.toBeUndefined();
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Socket emit failed",
      expect.objectContaining({ status: 500, error: "boom" }),
    );
  });

  it("logs but does not throw when fetch itself rejects (network error / timeout)", async () => {
    process.env.SOCKET_API_KEY = "key";
    process.env.SOCKET_SERVER_URL = "https://socket.test";
    mockFetch.mockRejectedValue(new Error("timed out"));
    const { emitTripCreated } = await loadModule();

    await expect(emitTripCreated("g1", { id: "t1" })).resolves.toBeUndefined();
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Socket emit errored",
      expect.objectContaining({ endpoint: "trip/created" }),
    );
  });
});

describe("expense event serialization", () => {
  beforeEach(() => {
    process.env.SOCKET_API_KEY = "key";
    process.env.SOCKET_SERVER_URL = "https://socket.test";
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("converts a Decimal amount and a Date to a plain number/ISO string, and slims paidBy", async () => {
    const { emitExpenseCreated } = await loadModule();

    await emitExpenseCreated("g1", {
      id: "e1",
      amount: new Decimal("42.50"),
      date: new Date("2026-10-01"),
      paidBy: { id: "u1", email: "a@x.com", name: "Alice", passwordHash: "should-not-leak" },
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.expense.amount).toBe(42.5);
    expect(body.expense.date).toBe("2026-10-01T00:00:00.000Z");
    expect(body.expense.paidBy).toEqual({ id: "u1", email: "a@x.com", name: "Alice" });
  });

  it("leaves a null paidBy (guest payer) and a plain-number amount as is", async () => {
    const { emitExpenseCreated } = await loadModule();

    await emitExpenseCreated("g1", { id: "e1", amount: 10, date: "2026-10-01", paidBy: null });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.expense.paidBy).toBeNull();
    expect(body.expense.amount).toBe(10);
  });

  it("attaches updatedBy onto the expense for emitExpenseUpdated", async () => {
    const { emitExpenseUpdated } = await loadModule();

    await emitExpenseUpdated(
      "g1",
      { id: "e1", amount: 10, date: "2026-10-01", paidBy: null },
      { updatedBy: "alice@x.com" },
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.expense.updatedBy).toBe("alice@x.com");
    expect(body.updatedBy).toBe("alice@x.com");
  });
});

describe("emitNotificationChangedToGroup", () => {
  it("sends only the groupId, never the notification body", async () => {
    process.env.SOCKET_API_KEY = "key";
    process.env.SOCKET_SERVER_URL = "https://socket.test";
    mockFetch.mockResolvedValue({ ok: true });
    const { emitNotificationChangedToGroup } = await loadModule();

    await emitNotificationChangedToGroup("g1");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({ groupId: "g1" });
  });
});
