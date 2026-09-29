import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { logger } from "@/lib/logger";
import type { WhatsNewFeature } from "@/src/app/config/whats-new";
import type { ColorPreset } from "./colorPresets";
import { addFeature, removeFeature, setFeatureColors, updateFeature } from "./whatsNewFeatureOps";

/** Loads, edits and saves the "what's new" modal config (version + feature list) shown to users. */
export function useWhatsNewConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState("");
  const [features, setFeatures] = useState<WhatsNewFeature[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get("/config/whats-new");
        setVersion(res.data.version);
        setFeatures(res.data.features);
        setError("");
      } catch (err) {
        logger.error("Failed to load whats-new config", { error: err });
        setError("Failed to load configuration. Make sure you are logged in.");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/config/whats-new", { version, features });
      alert("Configuration saved successfully!");
    } catch (err) {
      logger.error("Failed to save whats-new config", { error: err });
      alert("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    version,
    setVersion,
    features,
    error,
    handleSave,
    addFeature: () => setFeatures((prev) => addFeature(prev)),
    removeFeature: (index: number) => setFeatures((prev) => removeFeature(prev, index)),
    updateFeature: (index: number, field: keyof WhatsNewFeature, value: string) => setFeatures((prev) => updateFeature(prev, index, field, value)),
    setFeatureColors: (index: number, preset: ColorPreset) => setFeatures((prev) => setFeatureColors(prev, index, preset)),
  };
}
