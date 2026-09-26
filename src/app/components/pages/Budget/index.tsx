"use client";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useBudgets } from "@/src/hooks/useBudgets";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useGroup } from "@/src/hooks/useGroups";
import type { Budget, Trip } from "@/src/shared/types";
import LoadingState from "../../shared/LoadingState";
import { PILL } from "../../shared/Pills";
import { BudgetMeters } from "./BudgetMeters";
import { BudgetRow } from "./BudgetRow";

interface IBudgetComponent {
  groupId: string;
  tripId: string;
}

/** The Budget tab of a trip: planned, booked and spent, and the list of planned items. */
const BudgetComponent = ({ groupId, tripId }: IBudgetComponent) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: groupData, isLoading: loadingGroup } = useGroup(groupId);
  const { data: budgetsData, isLoading: loadingBudgets } = useBudgets(tripId);
  const { data: expensesData, isLoading: loadingExpenses } = useExpenses(tripId);

  const group = groupData?.group || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const budgets = budgetsData?.budgets || [];
  const expenses = expensesData?.expenses || [];

  const addHref = `/group/${groupId}/trip/${tripId}/budget/add`;

  const handleEditBudget = (budget: Budget) => {
    router.push(`/group/${groupId}/trip/${tripId}/budget/${budget.id}/edit`);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm("Are you sure you want to delete this budget item?")) return;
    try {
      await api.delete(`/trips/${tripId}/budgets/${budgetId}`);
      toast.success("Budget item deleted");
      queryClient.invalidateQueries({ queryKey: ["budgets", tripId] });
    } catch {
      toast.error("Failed to delete budget item");
    }
  };

  if (loadingGroup || loadingBudgets || loadingExpenses) return <LoadingState className='py-20' />;
  if (!group || !trip) return <p className='py-16 text-center text-sm text-[#94a3b8]'>This trip couldn&apos;t be found.</p>;

  return (
    <div className='flex flex-col gap-[18px]'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <span className='flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>
          Trip budget
          <span className='rounded-md border border-[rgba(167,139,250,.3)] bg-[rgba(167,139,250,.15)] px-[6px] py-[2px] text-[10px] font-bold text-[#c4b5fd]'>
            Beta
          </span>
        </span>
        <Link href={addHref} className={PILL.amber}>
          <Plus className='size-[14px]' strokeWidth={2.4} />
          Add item
        </Link>
      </div>

      <BudgetMeters budgets={budgets} expenses={expenses} />

      <div className='overflow-hidden rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)]'>
        <div className='flex justify-between border-b border-white/[.06] px-[18px] py-[14px] font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>
          <span>Planned items</span>
          <span>Booked</span>
        </div>
        {budgets.map((budget) => (
          <BudgetRow
            key={budget.id}
            budget={budget}
            groupId={groupId}
            tripId={tripId}
            onEdit={handleEditBudget}
            onDelete={handleDeleteBudget}
          />
        ))}
        {budgets.length === 0 ? <div className='p-7 text-center text-sm text-[#94a3b8]'>No budget items yet.</div> : null}
      </div>
    </div>
  );
};

export default BudgetComponent;
