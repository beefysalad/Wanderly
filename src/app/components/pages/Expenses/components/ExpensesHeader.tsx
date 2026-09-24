import { Plus, Receipt, Wallet } from "lucide-react";
import Link from "next/link";
import DashboardLayoutHeader from "../../../shared/DashboardLayoutHeader";
import type { ExpensesView } from "../expenseStats";
import { FilterTabs } from "./FilterTabs";

interface IExpensesHeaderProps {
  isEmbedded: boolean;
  groupId: string;
  tripId: string;
  tripName: string;
  view: ExpensesView;
  setView: (view: ExpensesView) => void;
  counts: { all: number; unsettled: number; settled: number };
}

export const ExpensesHeader = ({
  isEmbedded,
  groupId,
  tripId,
  tripName,
  view,
  setView,
  counts,
}: IExpensesHeaderProps) => {
  return (
    <>
    {!isEmbedded ? (
      <>
        <DashboardLayoutHeader
          showBack={true}
          title='Trip Expenses'
          description={
            <span className='flex items-center gap-2'>
              <span className='p-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 inline-flex'>
                <Wallet className='w-3 h-3 text-orange-400' />
              </span>
              <span>{tripName}</span>
            </span>
          }
          rightContent={
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setView("logs")}
                className={`p-3 rounded-2xl transition-all border flex items-center justify-center active:scale-95 ${
                  view === "logs"
                    ? "bg-slate-800 border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                    : "bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
                title='Payment History'
              >
                <Receipt className='w-6 h-6' />
              </button>
              <Link
                href={`/group/${groupId}/expenses/add?tripId=${tripId}`}
                className='p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/20 border border-white/10 flex items-center justify-center active:scale-95 transition-all w-12 h-12'
                title='Add Expense'
              >
                <Plus className='w-6 h-6' />
              </Link>
            </div>
          }
        />
        <div className='mb-6'>
          <FilterTabs isEmbedded={isEmbedded} view={view} setView={setView} counts={counts} />
        </div>
      </>
    ) : (
      // Embedded Header
      <div className='flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500'>
        <div className='flex items-center justify-end gap-2'>
          <button
            onClick={() => setView("logs")}
            className={`px-4 py-2.5 rounded-xl transition-all border flex items-center gap-2 active:scale-95 text-sm font-medium ${
              view === "logs"
                ? "bg-slate-800 border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                : "bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Receipt className='w-4 h-4' />
            <span>History</span>
          </button>
          {/* Inline Add Expense for desktop context mainly, mobile uses floating FAB */}
          <Link
            href={`/group/${groupId}/expenses/add?tripId=${tripId}`}
            className='hidden sm:flex px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/20 border border-white/10 items-center gap-2 active:scale-95 transition-all text-sm font-bold'
          >
            <Plus className='w-4 h-4' />
            <span>Add Expense</span>
          </Link>
        </div>
        <FilterTabs isEmbedded={isEmbedded} view={view} setView={setView} counts={counts} />
      </div>
    )}
    </>
  );
};
