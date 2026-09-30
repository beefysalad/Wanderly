"use client";

import { ArrowLeft, RefreshCcw, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfigList } from "./components/ConfigList";
import { MaintenanceToggleCard } from "./components/MaintenanceToggleCard";
import { useConfigList } from "./useConfigList";

export default function ConfigPage() {
  const router = useRouter();
  const { loading, configs, savingKey, fetchConfigs, handleUpdateConfig } = useConfigList();

  return (
    <main className='min-h-screen bg-slate-950 text-slate-200'>
      <div className='max-w-5xl mx-auto px-6 py-12'>
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button onClick={() => router.push("/admin")} className='p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors'>
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-white tracking-tight flex items-center gap-3'>
                System Configuration
                <Settings className='w-6 h-6 text-blue-500' />
              </h1>
              <p className='text-slate-400'>Manage global application settings and maintenance mode</p>
            </div>
          </div>

          <button onClick={fetchConfigs} className='flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm'>
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading && configs.length === 0 ? (
          <div className='flex justify-center py-12'>
            <div className='w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin' />
          </div>
        ) : (
          <div className='space-y-6'>
            <MaintenanceToggleCard configs={configs} savingKey={savingKey} onUpdate={handleUpdateConfig} />
            <ConfigList configs={configs} savingKey={savingKey} onUpdate={handleUpdateConfig} />
          </div>
        )}
      </div>
    </main>
  );
}
