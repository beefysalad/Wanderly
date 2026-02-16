import React from "react";
import { Budget, Expense } from "@/src/shared/types";
import { TrendingUp, Target, CheckCircle2 } from "lucide-react";

interface BudgetTrackerProps {
  budgets: Budget[];
  expenses: Expense[];
}

const BudgetTracker = ({ budgets, expenses }: BudgetTrackerProps) => {
  const totalPlanned = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalBooked = budgets
    .filter((b) => b.isBooked)
    .reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const spentPercentage =
    totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;
  const bookedPercentage =
    totalPlanned > 0 ? (totalBooked / totalPlanned) * 100 : 0;

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
      <div className='bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-2 rounded-xl bg-orange-500/10 border border-orange-500/20'>
            <Target className='w-5 h-5 text-orange-400' />
          </div>
          <h3 className='text-sm font-bold text-slate-400 uppercase tracking-wider'>
            Total Planned
          </h3>
        </div>
        <p className='text-3xl font-bold text-white tracking-tight'>
          ₱
          {totalPlanned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <div className='mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden'>
          <div
            className='h-full bg-orange-500 rounded-full transition-all duration-500'
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div className='bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20'>
            <CheckCircle2 className='w-5 h-5 text-emerald-400' />
          </div>
          <h3 className='text-sm font-bold text-slate-400 uppercase tracking-wider'>
            Total Booked
          </h3>
        </div>
        <p className='text-3xl font-bold text-white tracking-tight'>
          ₱{totalBooked.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <div className='mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden'>
          <div
            className='h-full bg-emerald-500 rounded-full transition-all duration-500'
            style={{ width: `${Math.min(bookedPercentage, 100)}%` }}
          />
        </div>
        <p className='text-xs text-slate-500 mt-2'>
          {bookedPercentage.toFixed(1)}% of planned
        </p>
      </div>

      <div className='bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-2 rounded-xl bg-blue-500/10 border border-blue-500/20'>
            <TrendingUp className='w-5 h-5 text-blue-400' />
          </div>
          <h3 className='text-sm font-bold text-slate-400 uppercase tracking-wider'>
            Total Spent
          </h3>
        </div>
        <p className='text-3xl font-bold text-white tracking-tight'>
          ₱{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <div className='mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden'>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              spentPercentage > 100 ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(spentPercentage, 100)}%` }}
          />
        </div>
        <div className='flex justify-between items-center mt-2'>
          <p className='text-xs text-slate-500'>
            {spentPercentage.toFixed(1)}% of planned
          </p>
          {spentPercentage > 100 && (
            <p className='text-xs text-red-400 font-bold'>Over Budget!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetTracker;
