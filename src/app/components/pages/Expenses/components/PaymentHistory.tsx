import { ArrowRight } from "lucide-react";
import { formatPeso } from "@/lib/utils/money";
import type { Group, PaymentLog } from "@/src/shared/types";
import { UserAvatar } from "../../../shared/UserAvatar";
import { getMemberAvatarFromLog } from "../paymentLogMembers";

interface IPaymentHistoryProps {
  group: Group;
  paymentLogs: PaymentLog[];
  isLoading: boolean;
}

const METHOD_EMOJI: Record<string, string> = { cash: "💵", bank: "🏦", maya: "💳", gcash: "💰" };

function Person({ log, side, group }: { log: PaymentLog; side: "payer" | "payee"; group: Group }) {
  const name = (side === "payer" ? log.payer : log.payee).split("@")[0];
  return (
    <span className='flex items-center gap-2 rounded-lg border border-white/[.05] bg-[rgba(2,6,23,.6)] px-2 py-1'>
      <UserAvatar name={name} colorKey={name} imageUrl={getMemberAvatarFromLog(log, side, group)} className='size-5 text-[9px]' />
      <span className='max-w-[100px] truncate text-[13px] font-medium text-[#cbd5e1]'>{name}</span>
    </span>
  );
}

/** Confirmed payments in this trip, newest first. */
export const PaymentHistory = ({ group, paymentLogs, isLoading }: IPaymentHistoryProps) => {
  if (isLoading) return <p className='py-16 text-center text-sm text-[#94a3b8]'>Loading…</p>;

  const sorted = [...paymentLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className='flex flex-col gap-2'>
      <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>Payment history</span>
      {sorted.map((log) => (
        <div
          key={log.id}
          className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[.06] bg-[rgba(15,23,42,.6)] p-[14px]'
        >
          <div className='flex min-w-0 flex-col gap-2'>
            <span className='flex items-center gap-2 truncate text-[15px] font-semibold'>
              <span>{METHOD_EMOJI[log.paymentMethod ?? "cash"] ?? "💵"}</span>
              {log.expenseDescription}
            </span>
            <span className='flex flex-wrap items-center gap-2'>
              <Person log={log} side='payer' group={group} />
              <ArrowRight className='size-[14px] text-[#475569]' />
              <Person log={log} side='payee' group={group} />
            </span>
          </div>
          <div className='text-right'>
            <p className='text-[17px] font-extrabold tabular-nums text-[#34d399]'>{formatPeso(log.amount)}</p>
            <p className='mt-[2px] font-mono text-[10px] text-[#64748b]'>
              {new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
        </div>
      ))}
      {sorted.length === 0 ? (
        <div className='rounded-[18px] border border-dashed border-white/[.14] p-7 text-center text-sm text-[#94a3b8]'>
          No payments logged yet. Confirmed payments will appear here.
        </div>
      ) : null}
    </div>
  );
};
