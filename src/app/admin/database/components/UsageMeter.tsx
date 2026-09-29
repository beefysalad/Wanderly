import { clampPercent } from "../clampPercent";

interface IUsageMeterProps {
  label: string;
  used: number;
  limit: number;
  percent: number;
  format?: (value: number) => string;
}

/** A labelled usage bar, e.g. "Cloudinary Storage: 2.1 GB / 25 GB". */
export const UsageMeter = ({ label, used, limit, percent, format }: IUsageMeterProps) => (
  <div className='space-y-2'>
    <div className='flex justify-between text-xs font-bold tracking-wider'>
      <span className='text-slate-400 uppercase'>{label}</span>
      <span className='text-white'>
        {format ? format(used) : used.toLocaleString()} / {format ? format(limit) : limit.toLocaleString()}
      </span>
    </div>
    <div className='h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5'>
      <div
        className={`h-full transition-all duration-500 rounded-full ${percent > 90 ? "bg-rose-500" : percent > 70 ? "bg-amber-500" : "bg-blue-500"}`}
        style={{ width: `${clampPercent(percent)}%` }}
      />
    </div>
    <div className='flex justify-end'>
      <span className={`text-[10px] font-bold ${percent > 90 ? "text-rose-400" : "text-slate-500"}`}>{percent.toFixed(1)}% Used</span>
    </div>
  </div>
);
