import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { logger } from "@/lib/logger";
import type { AdminUserSummary } from "@/src/shared/types";

/** Loads the admin user list/stats and deletes a user. */
export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, newToday: 0 });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/admin/users");
        setUsers(response.data.users);
        if (response.data.stats) setStats(response.data.stats);
      } catch (error) {
        logger.error("Failed to fetch users", { error });
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Delete this user from the database and Firebase? This can't be undone. Trips, expenses and payments shared with other members stay under their name, groups they own pass to the longest-standing member, and groups nobody else is in are deleted.",
      )
    ) {
      return;
    }

    setDeletingId(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (error) {
      logger.error("Failed to delete user", { error });
      toast.error("Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  return { users, loading, deletingId, stats, handleDeleteUser };
}
