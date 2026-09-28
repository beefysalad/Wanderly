"use client";

import { Activity, ArrowLeft, Database, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { EntityStatsGrid } from "./components/EntityStatsGrid";
import { MaintenanceCard } from "./components/MaintenanceCard";
import { UsageMeter } from "./components/UsageMeter";
import { formatBytes } from "./formatBytes";
import { useDbStats } from "./useDbStats";

export default function DatabasePage() {
  const router = useRouter();
  const { loading, stats, usage, maintaining, fetchStats, handleCleanTestData } = useDbStats();

  return (
    <main className='min-h-screen bg-slate-950 text-slate-200'>
      <div className='max-w-6xl mx-auto px-6 py-12'>
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button onClick={() => router.push("/admin")} className='p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors'>
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-white tracking-tight flex items-center gap-3'>
                Database Hub
                <Database className='w-6 h-6 text-purple-500' />
              </h1>
              <p className='text-slate-400'>Monitor data volume and perform maintenance tasks</p>
            </div>
          </div>

          <button onClick={fetchStats} className='flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm'>
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Stats
          </button>
        </div>

        {loading && !stats ? (
          <div className='flex justify-center py-12'>
            <div className='w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin' />
          </div>
        ) : stats ? (
          <div className='space-y-8'>
            <EntityStatsGrid stats={stats} />

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              <div className='bg-slate-900/50 border border-white/10 rounded-2xl p-8'>
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center gap-3'>
                    <Activity className='w-6 h-6 text-blue-500' />
                    <h2 className='text-xl font-bold text-white'>Resource Usage</h2>
                  </div>
                  {usage?.cloudinary?.plan ? (
                    <span className='px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20'>
                      {usage.cloudinary.plan} Plan
                    </span>
                  ) : null}
                </div>

                <div className='space-y-8'>
                  <div className='p-4 bg-white/5 rounded-xl border border-white/5'>
                    <div className='flex items-center gap-3 mb-2'>
                      <Database className='w-5 h-5 text-purple-400' />
                      <span className='text-sm font-bold text-white uppercase tracking-wider'>Database Size</span>
                    </div>
                    <div className='text-2xl font-bold text-white mb-1'>{usage ? formatBytes(usage.database.sizeBytes) : "Counting..."}</div>
                    <p className='text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed'>Total physical storage used by the PostgreSQL database.</p>
                  </div>

                  {usage?.cloudinary ? (
                    <div className='space-y-6'>
                      <UsageMeter
                        label='Cloudinary Storage'
                        used={usage.cloudinary.storage.used}
                        limit={usage.cloudinary.storage.limit}
                        percent={usage.cloudinary.storage.usedPercent}
                        format={formatBytes}
                      />
                      <UsageMeter
                        label='Cloudinary Bandwidth'
                        used={usage.cloudinary.bandwidth.used}
                        limit={usage.cloudinary.bandwidth.limit}
                        percent={usage.cloudinary.bandwidth.usedPercent}
                        format={formatBytes}
                      />
                    </div>
                  ) : (
                    <div className='text-center py-8 text-slate-500 text-sm border border-dashed border-white/10 rounded-xl'>Cloudinary usage data unavailable.</div>
                  )}
                </div>
              </div>

              <MaintenanceCard maintaining={maintaining} onCleanTestData={handleCleanTestData} />
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
