import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Budget } from "@/src/shared/types";

interface BudgetsResponse {
  budgets: Budget[];
}

interface BudgetResponse {
  budget: Budget;
}

interface CreateBudgetRequest {
  amount: number;
  description?: string;
  category?: string;
  activityId?: string;
  isBooked?: boolean;
}

interface UpdateBudgetRequest {
  amount?: number;
  description?: string;
  category?: string;
  activityId?: string;
  isBooked?: boolean;
}

/**
 * Query hook to fetch budgets for a trip
 */
export function useBudgets(tripId: string) {
  return useQuery<BudgetsResponse, Error>({
    queryKey: ["budgets", tripId],
    queryFn: async () => {
      const response = await api.get<BudgetsResponse>(
        `/trips/${tripId}/budgets`,
      );
      return response.data;
    },
  });
}

/**
 * Mutation hook to create a new budget item
 */
export function useCreateBudget(tripId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<BudgetResponse, Error, CreateBudgetRequest>({
    mutationFn: async (data) => {
      const response = await api.post<BudgetResponse>(
        `/trips/${tripId}/budgets`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", tripId] });
      // Also invalidate group query just in case it's used there
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

/**
 * Mutation hook to update a budget item
 */
export function useUpdateBudget(
  tripId: string,
  budgetId: string,
  groupId: string,
) {
  const queryClient = useQueryClient();

  return useMutation<BudgetResponse, Error, UpdateBudgetRequest>({
    mutationFn: async (data) => {
      const response = await api.put<BudgetResponse>(
        `/trips/${tripId}/budgets/${budgetId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", tripId] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

/**
 * Mutation hook to delete a budget item
 */
export function useDeleteBudget(
  tripId: string,
  budgetId: string,
  groupId: string,
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.delete(`/trips/${tripId}/budgets/${budgetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", tripId] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}
