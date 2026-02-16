import React from "react";
import { Budget, Activity } from "@/src/shared/types";
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface BudgetListProps {
  budgets: Budget[];
  onAddBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (budgetId: string) => void;
}

const BudgetList = ({
  budgets,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
}: BudgetListProps) => {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between px-1'>
        <h3 className='text-xl font-bold text-white flex items-center gap-2'>
          <Tag className='w-5 h-5 text-orange-400' />
          Budget Items
        </h3>
        <button
          onClick={onAddBudget}
          className='flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/5 transition-all active:scale-95 text-sm font-bold'
        >
          <Plus className='w-4 h-4' />
          Add Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className='bg-slate-900/30 border border-dashed border-slate-700 rounded-3xl p-12 text-center'>
          <div className='w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Tag className='w-8 h-8 text-slate-600' />
          </div>
          <p className='text-slate-400 font-medium mb-1'>No budget items yet</p>
          <p className='text-sm text-slate-600'>
            Plan your spending by adding budget estimates
          </p>
        </div>
      ) : (
        <div className='grid gap-3'>
          {budgets.map((budget) => (
            <div
              key={budget.id}
              className='bg-slate-800/40 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/5 hover:border-orange-500/20 transition-all hover:bg-slate-800/60 group'
            >
              <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
                <div className='flex-1 min-w-0'>
                  <div className='flex flex-wrap items-center gap-2 mb-2'>
                    <h4 className='font-bold text-white text-lg break-words leading-tight'>
                      {budget.description ||
                        budget.category ||
                        "Untitled Budget"}
                    </h4>
                    {budget.isBooked ? (
                      <span className='flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider'>
                        <CheckCircle2 className='w-3 h-3' />
                        Booked
                      </span>
                    ) : (
                      <span className='flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-bold text-orange-400 uppercase tracking-wider'>
                        <Circle className='w-3 h-3' />
                        Estimated
                      </span>
                    )}
                  </div>

                  <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-400'>
                    {budget.activity && (
                      <div className='flex items-center gap-1.5 min-w-0'>
                        <Calendar className='w-4 h-4 text-slate-500 flex-shrink-0' />
                        <span className='truncate'>
                          {budget.activity.title}
                        </span>
                      </div>
                    )}
                    {budget.category && (
                      <div className='flex items-center gap-1.5'>
                        <Tag className='w-4 h-4 text-slate-500 flex-shrink-0' />
                        <span>{budget.category}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex items-center justify-between sm:block sm:text-right mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-0'>
                  <p className='text-xl font-bold text-white tracking-tight'>
                    ₱
                    {Number(budget.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <div className='flex items-center gap-2 sm:mt-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity'>
                    <button
                      onClick={() => onEditBudget(budget)}
                      className='p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors'
                      title='Edit'
                    >
                      <Edit2 className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => onDeleteBudget(budget.id)}
                      className='p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors'
                      title='Delete'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetList;
