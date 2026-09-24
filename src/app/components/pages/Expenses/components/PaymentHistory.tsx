import { Receipt } from "lucide-react";
import Image from "next/image";
import type { Group, PaymentLog } from "@/src/shared/types";
import { getMemberAvatarFromLog, getMemberInitialsFromLog } from "../paymentLogMembers";

interface IPaymentHistoryProps {
  group: Group;
  paymentLogs: PaymentLog[];
  isLoading: boolean;
}

export const PaymentHistory = ({ group, paymentLogs, isLoading }: IPaymentHistoryProps) => {
  if (isLoading) {
    return (
      <div className='text-center py-20'>
        <div className='w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
        <p className='text-slate-400 font-medium'>
          Loading
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4 animate-in fade-in zoom-in-95 duration-300'>
      <h3 className='text-xl font-bold text-white px-1 flex items-center gap-2'>
        <Receipt className='w-5 h-5 text-orange-400' />
        Payment History
      </h3>

      {paymentLogs.length === 0 ? (
        <div className='bg-slate-900/30 border border-dashed border-slate-700 rounded-3xl p-12 text-center'>
          <div className='w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Receipt className='w-8 h-8 text-slate-600' />
          </div>
          <p className='text-slate-400 font-medium mb-1'>
            No payment logs yet
          </p>
          <p className='text-sm text-slate-600'>
            Payments and settlements will appear here
          </p>
        </div>
      ) : (
        <div className='grid gap-3'>
          {paymentLogs
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            )
            .map((log) => (
              <div
                key={log.id}
                className='bg-slate-800/40 backdrop-blur-sm rounded-2xl p-5 border border-white/5 hover:border-orange-500/20 transition-all hover:bg-slate-800/60 group'
              >
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-start gap-4 flex-1 min-w-0'>
                    <span className='text-2xl mt-1'>
                      {log.paymentMethod === "cash" && "💵"}
                      {log.paymentMethod === "bank" && "🏦"}
                      {log.paymentMethod === "maya" && "💳"}
                      {log.paymentMethod === "gcash" && "💰"}
                      {!log.paymentMethod && "💵"}
                    </span>
                    <div className='flex-1 min-w-0'>
                      <p className='font-bold text-white truncate mb-1 text-lg'>
                        {log.expenseDescription}
                      </p>

                      <div className='flex items-center gap-3 text-sm flex-wrap relative z-10'>
                        <div className='flex items-center gap-2 bg-slate-900/50 px-2 py-1 rounded-lg border border-white/5'>
                          {getMemberAvatarFromLog(log, "payer", group) ? (
                            <div className='relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0'>
                              <Image
                                src={
                                  getMemberAvatarFromLog(log, "payer", group)!
                                }
                                alt={log.payer.split("@")[0]}
                                fill
                                className='object-cover'
                              />
                            </div>
                          ) : (
                            <div className='w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0'>
                              {getMemberInitialsFromLog(
                                log,
                                "payer",
                              )}
                            </div>
                          )}
                          <span className='font-medium text-slate-300 truncate max-w-[100px]'>
                            {log.payer.split("@")[0]}
                          </span>
                        </div>

                        <span className='text-slate-500'>→</span>

                        <div className='flex items-center gap-2 bg-slate-900/50 px-2 py-1 rounded-lg border border-white/5'>
                          {getMemberAvatarFromLog(log, "payee", group) ? (
                            <div className='relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0'>
                              <Image
                                src={
                                  getMemberAvatarFromLog(log, "payee", group)!
                                }
                                alt={log.payee.split("@")[0]}
                                fill
                                className='object-cover'
                              />
                            </div>
                          ) : (
                            <div className='w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0'>
                              {getMemberInitialsFromLog(
                                log,
                                "payee",
                              )}
                            </div>
                          )}
                          <span className='font-medium text-slate-300 truncate max-w-[100px]'>
                            {log.payee.split("@")[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='text-right flex-shrink-0'>
                    <p className='text-xl font-bold text-emerald-400 tracking-tight'>
                      ₱{log.amount.toFixed(2)}
                    </p>
                    <p className='text-xs text-slate-500 mt-1'>
                      {new Date(log.timestamp).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
