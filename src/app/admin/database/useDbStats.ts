import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/src/lib/axios";
import { logger } from "@/src/lib/logger";

export interface DBStats {
  users: number;
  groups: number;
  trips: number;
  activities: number;
  expenses: number;
  budgets: number;
  notifications: number;
  reviews: number;
}

export interface UsageStat {
  used: number;
  limit: number;
  usedPercent: number;
}

export interface ResourceUsage {
  database: {
    sizeBytes: number;
  };
  cloudinary: {
    plan: string;
    storage: UsageStat;
    bandwidth: UsageStat;
    objects: UsageStat;
  } | null;
}

/** Loads the admin database stats/usage snapshot and runs the "clean test data" maintenance action. */
export function useDbStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DBStats | null>(null);
  const [usage, setUsage] = useState<ResourceUsage | null>(null);
  const [maintaining, setMaintaining] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/db/stats");
      setStats(response.data.stats);
      setUsage(response.data.usage);
    } catch (error) {
      logger.error("Failed to fetch stats", { error });
      toast.error("Failed to load database statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCleanTestData = async () => {
    if (!confirm("Are you sure you want to clean all test data? This will delete users and associated data marked as seeded test data.")) {
      return;
    }

    setMaintaining(true);
    try {
      const response = await api.post("/admin/db/maintenance", { action: "clean-test-data" });
      toast.success(response.data.message || `Successfully cleaned ${response.data.count} test users`);
      fetchStats();
    } catch (error) {
      logger.error("Maintenance failed", { error });
      toast.error("Database maintenance failed");
    } finally {
      setMaintaining(false);
    }
  };

  return { loading, stats, usage, maintaining, fetchStats, handleCleanTestData };
}
