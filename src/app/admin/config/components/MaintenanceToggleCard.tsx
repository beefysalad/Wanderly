import { useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { parseMaintenanceConfig, type ConfigItem } from "../configHelpers";

interface IMaintenanceToggleCardProps {
  configs: ConfigItem[];
  savingKey: string | null;
  onUpdate: (key: string, value: unknown) => void;
}

/** The maintenance-mode on/off toggle with its estimated-duration field. */
export const MaintenanceToggleCard = ({ configs, savingKey, onUpdate }: IMaintenanceToggleCardProps) => {
  const estimateRef = useRef<HTMLInputElement>(null);
  const { enabled, estimateDefault } = parseMaintenanceConfig(configs);
  const isSaving = savingKey === "maintenance-mode";

  const toggle = () => {
    onUpdate("maintenance-mode", { enabled: !enabled, estimate: estimateRef.current?.value ?? estimateDefault });
  };

  return (
    <div className='bg-slate-900/50 border border-white/10 rounded-2xl p-6'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
        <div className='flex items-center gap-4'>
          <div className='p-3 bg-rose-500/10 rounded-xl'>
            <AlertTriangle className='w-6 h-6 text-rose-500' />
          </div>
          <div>
            <h3 className='text-lg font-bold text-white'>Maintenance Mode</h3>
            <p className='text-sm text-slate-400'>When enabled, public visitors will see a maintenance page. Admins still have access.</p>
          </div>
        </div>
        <div className='flex flex-col sm:flex-row items-center gap-4'>
          <div className='flex flex-col gap-1 w-full sm:w-auto'>
            <label className='text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1'>Estimate Duration</label>
            <input
              ref={estimateRef}
              type='text'
              placeholder='e.g. 30-60 Minutes'
              className='bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 w-full'
              defaultValue={estimateDefault}
            />
          </div>
          <div className='w-full sm:w-auto mt-auto'>
            {enabled ? (
              <button
                onClick={toggle}
                disabled={isSaving}
                className='w-full px-6 py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors disabled:opacity-50'
              >
                {isSaving ? "Processing..." : "Turn OFF"}
              </button>
            ) : (
              <button
                onClick={toggle}
                disabled={isSaving}
                className='w-full px-6 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 border border-white/10 transition-colors disabled:opacity-50'
              >
                {isSaving ? "Processing..." : "Turn ON"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
