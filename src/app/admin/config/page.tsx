"use client";

import axios from "axios";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Layout,
  RefreshCcw,
  Save,
  Settings,
  Shield
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ConfigItem {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  updatedAt: string;
}

export default function ConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, [configs]);

  const fetchConfigs = async () => {
    try {
      const password = sessionStorage.getItem("admin_password");
      if (!password) {
        toast.error("Unauthorized");
        router.push("/admin");
        return;
      }

      const response = await axios.get("/api/admin/config", {
        headers: { "x-admin-password": password },
      });

      setConfigs(response.data.configs);
    } catch (error) {
      console.error("Failed to fetch configs", error);
      toast.error("Failed to load configurations");
    } finally {
      setLoading(false);
    }
  };
  
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateConfig = async (key: string, value: any) => {
    setSavingKey(key);
    try {
      const password = sessionStorage.getItem("admin_password");
      await axios.post(
        "/api/admin/config",
        { key, value },
        {
          headers: { "x-admin-password": password },
        },
      );

      toast.success(`${key} updated successfully`);
      fetchConfigs();
    } catch (error) {
      console.error("Failed to update config", error);
      toast.error(`Failed to update ${key}`);
    } finally {
      setSavingKey(null);
    }
  };

  const getIcon = (key: string) => {
    if (key.includes("maintenance")) return AlertTriangle;
    if (key.includes("whats-new")) return Layout;
    if (key.includes("notification")) return Bell;
    if (key.includes("auth") || key.includes("security")) return Shield;
    return Settings;
  };

  return (
    <main className='min-h-screen bg-slate-950 text-slate-200'>
      <div className='max-w-5xl mx-auto px-6 py-12'>
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => router.push("/admin")}
              className='p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-white tracking-tight flex items-center gap-3'>
                System Configuration
                <Settings className='w-6 h-6 text-blue-500' />
              </h1>
              <p className='text-slate-400'>
                Manage global application settings and maintenance mode
              </p>
            </div>
          </div>

          <button
            onClick={fetchConfigs}
            className='flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm'
          >
            <RefreshCcw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {loading && configs.length === 0 ? (
          <div className='flex justify-center py-12'>
            <div className='w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin' />
          </div>
        ) : (
          <div className='space-y-6'>
            {/* Maintenance Mode Special Toggle */}
            <div className='bg-slate-900/50 border border-white/10 rounded-2xl p-6'>
              <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                <div className='flex items-center gap-4'>
                  <div className='p-3 bg-rose-500/10 rounded-xl'>
                    <AlertTriangle className='w-6 h-6 text-rose-500' />
                  </div>
                  <div>
                    <h3 className='text-lg font-bold text-white'>
                      Maintenance Mode
                    </h3>
                    <p className='text-sm text-slate-400'>
                      When enabled, public visitors will see a maintenance page.
                      Admins still have access.
                    </p>
                  </div>
                </div>
                <div className='flex flex-col sm:flex-row items-center gap-4'>
                  <div className='flex flex-col gap-1 w-full sm:w-auto'>
                    <label className='text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1'>
                      Estimate Duration
                    </label>
                    <input
                      type='text'
                      placeholder='e.g. 30-60 Minutes'
                      className='bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 w-full'
                      id='maintenance-estimate'
                      defaultValue={
                        typeof configs.find((c) => c.key === "maintenance-mode")
                          ?.value === "object"
                          ? (
                              configs.find((c) => c.key === "maintenance-mode")
                               // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                ?.value as any
                            ).estimate
                          : "30-60 Minutes"
                      }
                    />
                  </div>
                  <div className='w-full sm:w-auto mt-auto'>
                    {(() => {
                      const config = configs.find(
                        (c) => c.key === "maintenance-mode",
                      );
                      const isEnabled =
                        typeof config?.value === "object"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          ? (config.value as any).enabled
                          : config?.value === true;

                      return isEnabled ? (
                        <button
                          onClick={() => {
                            const est = (
                              document.getElementById(
                                "maintenance-estimate",
                              ) as HTMLInputElement
                            ).value;
                            handleUpdateConfig("maintenance-mode", {
                              enabled: false,
                              estimate: est,
                            });
                          }}
                          disabled={savingKey === "maintenance-mode"}
                          className='w-full px-6 py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors disabled:opacity-50'
                        >
                          {savingKey === "maintenance-mode"
                            ? "Processing..."
                            : "Turn OFF"}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const est = (
                              document.getElementById(
                                "maintenance-estimate",
                              ) as HTMLInputElement
                            ).value;
                            handleUpdateConfig("maintenance-mode", {
                              enabled: true,
                              estimate: est,
                            });
                          }}
                          disabled={savingKey === "maintenance-mode"}
                          className='w-full px-6 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 border border-white/10 transition-colors disabled:opacity-50'
                        >
                          {savingKey === "maintenance-mode"
                            ? "Processing..."
                            : "Turn ON"}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Other Configurations */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white px-2'>
                Global Settings
              </h2>
              {configs
                .filter((c) => c.key !== "maintenance-mode")
                .map((config) => {
                  const Icon = getIcon(config.key);
                  return (
                    <div
                      key={config.key}
                      className='bg-slate-900/50 border border-white/10 rounded-2xl p-6 group'
                    >
                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex items-center gap-4'>
                          <div className='p-2 bg-blue-500/10 rounded-lg'>
                            <Icon className='w-5 h-5 text-blue-400' />
                          </div>
                          <div>
                            <h4 className='font-bold text-white uppercase tracking-wider text-sm'>
                              {config.key}
                            </h4>
                            <p className='text-xs text-slate-500'>
                              Last updated:{" "}
                              {format(
                                new Date(config.updatedAt),
                                "MMM d, HH:mm",
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className='space-y-4'>
                        <textarea
                          className='w-full bg-slate-950/50 border border-white/5 rounded-xl p-4 text-sm font-mono text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[120px]'
                          defaultValue={JSON.stringify(config.value, null, 2)}
                          id={`input-${config.key}`}
                        />
                        <div className='flex justify-end'>
                          <button
                            onClick={() => {
                              const el = document.getElementById(
                                `input-${config.key}`,
                              ) as HTMLTextAreaElement;
                              try {
                                const val = JSON.parse(el.value);
                                handleUpdateConfig(config.key, val);
                              } catch (e) {
                                toast.error("Invalid JSON format");
                              }
                            }}
                            disabled={savingKey === config.key}
                            className='flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-sm font-bold disabled:opacity-50'
                          >
                            <Save className='w-4 h-4' />
                            {savingKey === config.key
                              ? "Saving..."
                              : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {configs.filter((c) => c.key !== "maintenance-mode").length ===
                0 && (
                <div className='text-center py-12 border border-dashed border-white/10 rounded-2xl text-slate-500'>
                  No other configurations found.
                </div>
              )}
            </div>

            {/* Quick Add */}
            <div className='bg-white/5 border border-dashed border-white/10 rounded-2xl p-6'>
              <h4 className='text-sm font-bold text-white mb-4'>
                Add New Setting
              </h4>
              <div className='flex gap-4'>
                <input
                  type='text'
                  placeholder='Key (e.g. site-banner)'
                  className='flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                  id='new-config-key'
                />
                <button
                  onClick={() => {
                    const keyEl = document.getElementById(
                      "new-config-key",
                    ) as HTMLInputElement;
                    if (!keyEl.value) return toast.error("Key is required");
                    handleUpdateConfig(keyEl.value, {});
                    keyEl.value = "";
                  }}
                  className='px-6 py-2 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-all border border-white/10'
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
