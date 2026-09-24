import type { NotificationType } from "@prisma/client";
import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/errors";

const mockSync = vi.fn();
vi.mock("../sync/syncService", () => ({
  syncUserToDatabaseService: (...a: unknown[]) => mockSync(...a),
}));

const mockCreateRow = vi.fn();
const mockFindFirebaseId = vi.fn();
const mockList = vi.fn();
const mockFindById = vi.fn();
const mockMarkRead = vi.fn();
const mockMarkAll = vi.fn();
const mockCount = vi.fn();
vi.mock("./repository", () => ({
  createNotificationRow: (...a: unknown[]) => mockCreateRow(...a),
  findUserFirebaseId: (...a: unknown[]) => mockFindFirebaseId(...a),
  listNotificationsByUser: (...a: unknown[]) => mockList(...a),
  findNotificationById: (...a: unknown[]) => mockFindById(...a),
  markNotificationRead: (...a: unknown[]) => mockMarkRead(...a),
  markAllNotificationsRead: (...a: unknown[]) => mockMarkAll(...a),
  countUnreadNotifications: (...a: unknown[]) => mockCount(...a),
}));

const mockEmitUser = vi.fn();
const mockEmitGroup = vi.fn();
vi.mock("@/lib/socket-events", () => ({
  emitNotificationToUser: (...a: unknown[]) => mockEmitUser(...a),
  emitNotificationToGroup: (...a: unknown[]) => mockEmitGroup(...a),
}));

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const {
  createNotificationService,
  getUnreadCountService,
  listNotificationsService,
  markAllNotificationsReadService,
  markNotificationReadService,
} = await import("./services");

const token = { uid: "f1" } as DecodedIdToken;
const base = { type: "expense_added" as NotificationType, title: "t", message: "m" };

beforeEach(() => {
  vi.clearAllMocks();
  mockSync.mockResolvedValue({ id: "u1" });
  mockCreateRow.mockResolvedValue({ id: "n1" });
  mockFindFirebaseId.mockResolvedValue({ firebaseId: "fb-u2" });
  mockEmitUser.mockResolvedValue(undefined);
  mockEmitGroup.mockResolvedValue(undefined);
});

describe("createNotificationService", () => {
  it("stores missing related ids as null and emits to the user's room", async () => {
    await createNotificationService("u2", base);

    expect(mockCreateRow).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u2",
        relatedGroupId: null,
        relatedTripId: null,
        relatedExpenseId: null,
        relatedActivityId: null,
      }),
    );
    expect(mockEmitUser).toHaveBeenCalledWith("fb-u2", { id: "n1" });
    expect(mockEmitGroup).not.toHaveBeenCalled();
  });

  it("also emits to the group room for group-related notifications", async () => {
    await createNotificationService("u2", { ...base, relatedGroupId: "g1" });

    expect(mockEmitGroup).toHaveBeenCalledWith("g1", { id: "n1" });
  });

  it("skips the user emit when the user has no firebase id, and survives emit failures", async () => {
    mockFindFirebaseId.mockResolvedValue({ firebaseId: null });
    mockEmitGroup.mockRejectedValue(new Error("socket down"));

    await expect(
      createNotificationService("u2", { ...base, relatedGroupId: "g1" }),
    ).resolves.toEqual({ id: "n1" });
    expect(mockEmitUser).not.toHaveBeenCalled();
  });
});

describe("listNotificationsService", () => {
  it("computes hasMore from offset, page size and total", async () => {
    mockList.mockResolvedValue({ notifications: [{}, {}], total: 5 });

    const page = await listNotificationsService(token, { limit: 2, offset: 0 });
    mockList.mockResolvedValue({ notifications: [{}], total: 5 });
    const last = await listNotificationsService(token, { limit: 2, offset: 4 });

    expect(mockList).toHaveBeenCalledWith("u1", { limit: 2, offset: 4 });
    expect(page.hasMore).toBe(true);
    expect(last.hasMore).toBe(false);
  });
});

describe("markNotificationReadService", () => {
  it("reports a missing or someone else's notification as not found", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(markNotificationReadService(token, "n1")).rejects.toThrow(NotFoundError);

    mockFindById.mockResolvedValue({ id: "n1", userId: "other", read: false });
    await expect(markNotificationReadService(token, "n1")).rejects.toThrow(NotFoundError);
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it("returns an already-read notification without updating it", async () => {
    const already = { id: "n1", userId: "u1", read: true };
    mockFindById.mockResolvedValue(already);

    expect(await markNotificationReadService(token, "n1")).toBe(already);
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it("marks an unread notification as read", async () => {
    mockFindById.mockResolvedValue({ id: "n1", userId: "u1", read: false });
    mockMarkRead.mockResolvedValue({ id: "n1", read: true });

    expect(await markNotificationReadService(token, "n1")).toEqual({ id: "n1", read: true });
  });
});

describe("bulk and count", () => {
  it("marks all read for the current user", async () => {
    mockMarkAll.mockResolvedValue({ count: 3 });

    expect(await markAllNotificationsReadService(token)).toEqual({ count: 3 });
    expect(mockMarkAll).toHaveBeenCalledWith("u1");
  });

  it("returns the unread count", async () => {
    mockCount.mockResolvedValue(7);

    expect(await getUnreadCountService(token)).toEqual({ count: 7 });
  });
});
