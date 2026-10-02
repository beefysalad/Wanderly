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

/** Loads the admin database stats/usage snapshot. */
export function useDbStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DBStats | null>(null);
  const [usage, setUsage] = useState<ResourceUsage | null>(null);

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

  return { loading, stats, usage, fetchStats };
}
