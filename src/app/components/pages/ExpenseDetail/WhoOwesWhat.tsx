import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/utils/money";
import { UserAvatar } from "../../shared/UserAvatar";
import { STATUS_STYLE, type MemberStatus } from "./expenseDetailView";

export interface OwesRow {
  email: string;
  name: string;
  imageUrl?: string;
  status: MemberStatus;
  share: number;
  isYou: boolean;
}

interface WhoOwesWhatProps {
  rows: OwesRow[];
  /** The payer can confirm or reject a payment someone marked as paid. */
  canConfirm: boolean;
  onConfirm?: (email: string, status: "confirmed" | "rejected") => void;
}

/** Each person in the split, what their share is, and where their payment stands. */
export function WhoOwesWhat({ rows, canConfirm, onConfirm }: WhoOwesWhatProps) {
  return (
    <div className='overflow-hidden rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)]'>
      <div className='border-b border-white/[.06] px-[18px] py-[14px] font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>
        Who owes what
      </div>
      {rows.map((row) => (
        <div key={row.email} className='flex flex-wrap items-center gap-3 border-t border-white/[.05] px-[18px] py-3 first:border-t-0'>
          <UserAvatar name={row.name} colorKey={row.email} imageUrl={row.imageUrl} className='size-[34px] text-[11px]' />
          <span className='flex min-w-[100px] flex-1 flex-col gap-[2px]'>
            <span className='text-sm font-semibold text-[#e2e8f0]'>
              {row.name}
              {row.isYou ? " (you)" : ""}
            </span>
            <span className='text-xs tabular-nums text-[#64748b]'>{formatPeso(row.share)} share</span>
          </span>
          {canConfirm && onConfirm && row.status === "pending" ? (
            <span className='flex gap-[6px]'>
              <button
                type='button'
                onClick={() => onConfirm(row.email, "confirmed")}
                className='cursor-pointer rounded-full bg-[#34d399] px-3 py-[6px] text-xs font-bold text-[#052e1f]'
              >
                Confirm
              </button>
              <button
                type='button'
                onClick={() => onConfirm(row.email, "rejected")}
                className='cursor-pointer rounded-full border border-[rgba(248,113,113,.3)] px-3 py-[6px] text-xs font-bold text-[#f87171]'
              >
                Reject
              </button>
            </span>
          ) : null}
          <span className={cn("rounded-full border px-[10px] py-1 text-[11px] font-bold", STATUS_STYLE[row.status].pill)}>
            {STATUS_STYLE[row.status].label}
          </span>
        </div>
      ))}
    </div>
  );
}
