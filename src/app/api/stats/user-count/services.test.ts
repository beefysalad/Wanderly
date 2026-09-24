import { describe, expect, it, vi } from "vitest";

const mockCountUsers = vi.fn();
vi.mock("./repository", () => ({ countUsers: (...a: unknown[]) => mockCountUsers(...a) }));

const { getUserCountService } = await import("./services");

describe("getUserCountService", () => {
  it("wraps the user count", async () => {
    mockCountUsers.mockResolvedValue(42);

    expect(await getUserCountService()).toEqual({ count: 42 });
  });
});
