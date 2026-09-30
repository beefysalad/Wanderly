import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/src/lib/axios";
import { logger } from "@/src/lib/logger";
import type { ConfigItem } from "./configHelpers";

/** Loads and edits the admin `AppConfig` key/value rows (maintenance mode plus anything else stored there). */
export function useConfigList() {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      const response = await api.get("/admin/config");
      setConfigs(response.data.configs);
    } catch (error) {
      logger.error("Failed to fetch configs", { error });
      toast.error("Failed to load configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleUpdateConfig = async (key: string, value: unknown) => {
    setSavingKey(key);
    try {
      await api.post("/admin/config", { key, value });
      toast.success(`${key} updated successfully`);
      fetchConfigs();
    } catch (error) {
      logger.error("Failed to update config", { error });
      toast.error(`Failed to update ${key}`);
    } finally {
      setSavingKey(null);
    }
  };

  return { loading, configs, savingKey, fetchConfigs, handleUpdateConfig };
}
