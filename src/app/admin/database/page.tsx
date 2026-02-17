"use client";

import axios from "axios";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  Briefcase,
  CreditCard,
  Database,
  Layers,
  Map,
  MessageSquare,
  RefreshCcw,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface DBStats {
  users: number;
  groups: number;
  trips: number;
  activities: number;
  expenses: number;
  budgets: number;
  notifications: number;
  reviews: number;
}

interface UsageStat {
  used: number;
  limit: number;
  usedPercent: number;
}

interface ResourceUsage {
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

export default function DatabasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DBStats | null>(null);
  const [usage, setUsage] = useState<ResourceUsage | null>(null);
  const [maintaining, setMaintaining] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const password = sessionStorage.getItem("admin_password");
      if (!password) {
        toast.error("Unauthorized");
        router.push("/admin");
        return;
      }

      const response = await axios.get("/api/admin/db/stats", {
        headers: { "x-admin-password": password },
      });

      setStats(response.data.stats);
      setUsage(response.data.usage);
    } catch (error) {
      console.error("Failed to fetch stats", error);
      toast.error("Failed to load database statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleCleanTestData = async () => {
    if (
      !confirm(
        "Are you sure you want to clean all test data? This will delete users and associated data marked as seeded test data.",
      )
    ) {
      return;
    }

    setMaintaining(true);
    try {
      const password = sessionStorage.getItem("admin_password");
      const response = await axios.post(
        "/api/admin/db/maintenance",
        { action: "clean-test-data" },
        { headers: { "x-admin-password": password } },
      );

      toast.success(
        response.data.message ||
          `Successfully cleaned ${response.data.count} test users`,
      );
      fetchStats();
    } catch (error) {
      console.error("Maintenance failed", error);
      toast.error("Database maintenance failed");
    } finally {
      setMaintaining(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className='bg-slate-900/50 border border-white/10 rounded-2xl p-6'>
      <div className='flex items-center gap-4 mb-2'>
        <div className={`p-2 rounded-lg ${color.bg}`}>
          <Icon className={`w-5 h-5 ${color.text}`} />
        </div>
        <span className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
          {label}
        </span>
      </div>
      <div className='text-3xl font-bold text-white'>
        {value.toLocaleString()}
      </div>
    </div>
  );

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const UsageBar = ({ label, used, limit, percent, format }: any) => (
    <div className='space-y-2'>
      <div className='flex justify-between text-xs font-bold tracking-wider'>
        <span className='text-slate-400 uppercase'>{label}</span>
        <span className='text-white'>
          {format ? format(used) : used.toLocaleString()} /{" "}
          {format ? format(limit) : limit.toLocaleString()}
        </span>
      </div>
      <div className='h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5'>
        <div
          className={`h-full transition-all duration-500 rounded-full ${percent > 90 ? "bg-rose-500" : percent > 70 ? "bg-amber-500" : "bg-blue-500"}`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <div className='flex justify-end'>
        <span
          className={`text-[10px] font-bold ${percent > 90 ? "text-rose-400" : "text-slate-500"}`}
        >
          {percent.toFixed(1)}% Used
        </span>
      </div>
    </div>
  );

  return (
    <main className='min-h-screen bg-slate-950 text-slate-200'>
      <div className='max-w-6xl mx-auto px-6 py-12'>
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
                Database Hub
                <Database className='w-6 h-6 text-purple-500' />
              </h1>
              <p className='text-slate-400'>
                Monitor data volume and perform maintenance tasks
              </p>
            </div>
          </div>

          <button
            onClick={fetchStats}
            className='flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm'
          >
            <RefreshCcw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Stats
          </button>
        </div>

        {loading && !stats ? (
          <div className='flex justify-center py-12'>
            <div className='w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin' />
          </div>
        ) : stats ? (
          <div className='space-y-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <StatCard
                icon={Users}
                label='Users'
                value={stats.users}
                color={{ bg: "bg-blue-500/10", text: "text-blue-400" }}
              />
              <StatCard
                icon={Briefcase}
                label='Groups'
                value={stats.groups}
                color={{ bg: "bg-orange-500/10", text: "text-orange-400" }}
              />
              <StatCard
                icon={Map}
                label='Trips'
                value={stats.trips}
                color={{ bg: "bg-emerald-500/10", text: "text-emerald-400" }}
              />
              <StatCard
                icon={Layers}
                label='Activities'
                value={stats.activities}
                color={{ bg: "bg-purple-500/10", text: "text-purple-400" }}
              />
              <StatCard
                icon={CreditCard}
                label='Expenses'
                value={stats.expenses}
                color={{ bg: "bg-rose-500/10", text: "text-rose-400" }}
              />
              <StatCard
                icon={Target}
                label='Budgets'
                value={stats.budgets}
                color={{ bg: "bg-amber-500/10", text: "text-amber-400" }}
              />
              <StatCard
                icon={Bell}
                label='Notifications'
                value={stats.notifications}
                color={{ bg: "bg-indigo-500/10", text: "text-indigo-400" }}
              />
              <StatCard
                icon={MessageSquare}
                label='Reviews'
                value={stats.reviews}
                color={{ bg: "bg-cyan-500/10", text: "text-cyan-400" }}
              />
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              {/* Resource Usage */}
              <div className='bg-slate-900/50 border border-white/10 rounded-2xl p-8'>
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center gap-3'>
                    <Activity className='w-6 h-6 text-blue-500' />
                    <h2 className='text-xl font-bold text-white'>
                      Resource Usage
                    </h2>
                  </div>
                  {usage?.cloudinary?.plan && (
                    <span className='px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20'>
                      {usage.cloudinary.plan} Plan
                    </span>
                  )}
                </div>

                <div className='space-y-8'>
                  {/* Database Size (Estimated) */}
                  <div className='p-4 bg-white/5 rounded-xl border border-white/5'>
                    <div className='flex items-center gap-3 mb-2'>
                      <Database className='w-5 h-5 text-purple-400' />
                      <span className='text-sm font-bold text-white uppercase tracking-wider'>
                        Database Size
                      </span>
                    </div>
                    <div className='text-2xl font-bold text-white mb-1'>
                      {usage
                        ? formatBytes(usage.database.sizeBytes)
                        : "Counting..."}
                    </div>
                    <p className='text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed'>
                      Total physical storage used by the PostgreSQL database.
                    </p>
                  </div>

                  {/* Cloudinary Stats */}
                  {usage?.cloudinary ? (
                    <div className='space-y-6'>
                      <UsageBar
                        label='Cloudinary Storage'
                        used={usage.cloudinary.storage.used}
                        limit={usage.cloudinary.storage.limit}
                        percent={usage.cloudinary.storage.usedPercent}
                        format={formatBytes}
                      />
                      <UsageBar
                        label='Cloudinary Bandwidth'
                        used={usage.cloudinary.bandwidth.used}
                        limit={usage.cloudinary.bandwidth.limit}
                        percent={usage.cloudinary.bandwidth.usedPercent}
                        format={formatBytes}
                      />
                    </div>
                  ) : (
                    <div className='text-center py-8 text-slate-500 text-sm border border-dashed border-white/10 rounded-xl'>
                      Cloudinary usage data unavailable.
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance Actions */}
              <div className='bg-slate-900/50 border border-white/10 rounded-2xl p-8'>
                <div className='flex items-center gap-3 mb-6'>
                  <AlertTriangle className='w-6 h-6 text-amber-500' />
                  <h2 className='text-xl font-bold text-white'>
                    Maintenance Actions
                  </h2>
                </div>

                <div className='space-y-6'>
                  <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
                    <div className='flex items-center gap-3 mb-2'>
                      <Trash2 className='w-5 h-5 text-rose-500' />
                      <h3 className='font-bold text-white'>Clean Test Data</h3>
                    </div>
                    <p className='text-sm text-slate-400 mb-6'>
                      Removes all users and their data that were created via the
                      test seeding service. Use this periodically to keep the
                      database lean.
                    </p>
                    <button
                      onClick={handleCleanTestData}
                      disabled={maintaining}
                      className='w-full py-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold hover:bg-rose-500/20 transition-all disabled:opacity-50'
                    >
                      {maintaining ? "Cleaning..." : "Clean Test Data Now"}
                    </button>
                  </div>

                  <div className='bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col justify-center items-center text-center opacity-50 cursor-not-allowed'>
                    <Database className='w-10 h-10 text-slate-600 mb-4' />
                    <h3 className='font-bold text-slate-400'>
                      Database Optimization
                    </h3>
                    <p className='text-sm text-slate-600'>Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
