"use client";
import { Budget, Activity, Trip } from "@/src/shared/types";
import { useBudgets, useDeleteBudget } from "@/src/hooks/useBudgets";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useGroup } from "@/src/hooks/useGroups";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import BudgetTracker from "./BudgetTracker";
import BudgetList from "./BudgetList";
import DashboardLayoutHeader from "../../shared/DashboardLayoutHeader";
import { Target, Plus } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import BetaModal from "../../shared/Modal/BetaModal";
import React, { useState, useEffect } from "react";

interface IBudgetComponent {
  groupId: string;
  tripId: string;
  isEmbedded?: boolean;
}

const BudgetComponent = ({
  groupId,
  tripId,
  isEmbedded = false,
}: IBudgetComponent) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showBetaModal, setShowBetaModal] = useState(false);

  useEffect(() => {
    // Check if user has seen beta modal for this session
    const hasSeenBeta = sessionStorage.getItem("hasSeenBudgetBeta");
    if (!hasSeenBeta && !isEmbedded) {
      setShowBetaModal(true);
    }
  }, [isEmbedded]);

  const handleCloseBetaModal = () => {
    setShowBetaModal(false);
    sessionStorage.setItem("hasSeenBudgetBeta", "true");
  };

  const { data: groupData, isLoading: loadingGroup } = useGroup(groupId);
  const { data: budgetsData, isLoading: loadingBudgets } = useBudgets(tripId);
  const { data: expensesData, isLoading: loadingExpenses } =
    useExpenses(tripId);

  const group = groupData?.group || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const budgets = budgetsData?.budgets || [];
  const expenses = expensesData?.expenses || [];

  const handleEditBudget = (budget: Budget) => {
    router.push(`/group/${groupId}/trip/${tripId}/budget/${budget.id}/edit`);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (confirm("Are you sure you want to delete this budget item?")) {
      try {
        await api.delete(`/trips/${tripId}/budgets/${budgetId}`);
        toast.success("Budget item deleted");
        queryClient.invalidateQueries({ queryKey: ["budgets", tripId] });
      } catch (error) {
        toast.error("Failed to delete budget item");
      }
    }
  };

  const handleAddBudget = () => {
    router.push(`/group/${groupId}/trip/${tripId}/budget/add`);
  };

  if (loadingGroup || loadingBudgets || loadingExpenses) {
    if (isEmbedded) {
      return (
        <div className='flex items-center justify-center py-20'>
          <div className='w-8 h-8 border-2 border-slate-700 border-t-orange-500 rounded-full animate-spin mr-3'></div>
          <p className='text-slate-400 font-medium'>Loading budget...</p>
        </div>
      );
    }
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-400 font-medium'>Loading budget...</p>
        </div>
      </main>
    );
  }

  if (!group || !trip) {
    if (isEmbedded) {
      return (
        <div className='text-center py-10'>
          <p className='text-slate-400'>Trip not found.</p>
        </div>
      );
    }
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-xl border border-white/5 p-8 max-w-md'>
          <div className='w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-xl font-bold text-white mb-2'>Trip Not Found</h2>
          <p className='text-slate-400 mb-6'>
            This trip doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push(`/group/${groupId}/trip/${tripId}`)}
            className='px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-orange-500/20'
          >
            Go Back to Trip
          </button>
        </div>
      </main>
    );
  }

  const Wrapper = isEmbedded ? "div" : "main";
  const wrapperClass = isEmbedded
    ? ""
    : "min-h-screen bg-slate-950 pb-6 relative overflow-hidden";

  return (
    <Wrapper className={wrapperClass}>
      {showBetaModal && <BetaModal onClose={handleCloseBetaModal} />}
      {!isEmbedded && (
        <div className='fixed inset-0 pointer-events-none'>
          <div className='absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px]'></div>
          <div className='absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[100px]'></div>
        </div>
      )}

      <div
        className={`max-w-4xl mx-auto ${!isEmbedded ? "px-4 py-4 md:py-6" : ""} relative z-10`}
      >
        {!isEmbedded && (
          <DashboardLayoutHeader
            showBack={true}
            title='Trip Budget'
            description={
              <span className='flex items-center gap-2'>
                <span className='p-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 inline-flex'>
                  <Target className='w-3 h-3 text-orange-400' />
                </span>
                <span>{trip.name}</span>
                <div className='group relative flex items-center ml-2'>
                  <span className='px-1.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-300 cursor-help'>
                    BETA
                  </span>
                  <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded-md shadow-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center'>
                    This feature is still in beta and may be unstable.
                    <div className='absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800'></div>
                  </div>
                </div>
              </span>
            }
            rightContent={
              <Link
                href={`/group/${groupId}/trip/${tripId}/budget/add`}
                className='p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/20 border border-white/10 flex items-center justify-center active:scale-95 transition-all w-12 h-12'
                title='Add Budget'
              >
                <Plus className='w-6 h-6' />
              </Link>
            }
          />
        )}

        {isEmbedded && (
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <h2 className='text-xl font-bold text-white'>Trip Budget</h2>
              <div className='group relative flex items-center'>
                <span className='px-1.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-300 cursor-help'>
                  BETA
                </span>
                <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded-md shadow-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center'>
                  This feature is still in beta and may be unstable.
                  <div className='absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800'></div>
                </div>
              </div>
            </div>
            <button
              onClick={handleAddBudget}
              className='hidden sm:flex px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/20 border border-white/10 items-center gap-2 active:scale-95 transition-all text-sm font-bold'
            >
              <Plus className='w-4 h-4' />
              <span>Add Budget</span>
            </button>
          </div>
        )}

        <div className='animate-in fade-in zoom-in-95 duration-300 space-y-6'>
          <BudgetTracker budgets={budgets} expenses={expenses} />

          <BudgetList
            budgets={budgets}
            onAddBudget={handleAddBudget}
            onEditBudget={handleEditBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        </div>
      </div>
    </Wrapper>
  );
};

export default BudgetComponent;
