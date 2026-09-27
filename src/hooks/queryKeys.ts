/**
 * Every TanStack Query key in the app. Queries, mutations, socket handlers and optimistic cache
 * patches all build their keys here, so an invalidation always names what the query cached.
 *
 * Keys are hierarchical and TanStack matches invalidations by prefix: `groups.all` covers every
 * group key, and `groups.detail(id)` also covers `groups.guest(id)`, so a socket event for a group
 * refreshes a guest's view of it too. `expenses.all` / `paymentLogs.all` cover every trip.
 */
export const queryKeys = {
  groups: {
    all: ["groups"] as const,
    detail: (groupId: string | null) => ["groups", groupId] as const,
    guest: (groupId: string | null) => ["groups", groupId, "guest"] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    trip: (tripId: string | null) => ["expenses", tripId] as const,
  },
  paymentLogs: {
    all: ["paymentLogs"] as const,
    trip: (tripId: string | null) => ["paymentLogs", tripId] as const,
  },
  budgets: {
    trip: (tripId: string | null) => ["budgets", tripId] as const,
  },
  /** The signed-in user's database record (`GET /profile`). */
  currentUser: ["current-user-db"] as const,
  notifications: {
    all: ["notifications"] as const,
    list: (options?: { limit?: number; offset?: number; read?: boolean }) =>
      ["notifications", "list", options ?? {}] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    page: (page: number, limit: number, rating?: number | null) =>
      ["reviews", page, limit, rating ?? null] as const,
  },
  userCount: ["user-count"] as const,
};
