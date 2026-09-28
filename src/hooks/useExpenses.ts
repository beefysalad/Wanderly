import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Expense, PaymentLog } from "@/src/shared/types";
import { queryKeys } from "./queryKeys";

interface ExpensesResponse {
  expenses: Expense[];
}

interface ExpenseResponse {
  expense: Expense;
}

interface PaymentLogsResponse {
  paymentLogs: PaymentLog[];
}

interface CreateExpenseRequest {
  paidBy: string;
  amount: number;
  description: string;
  date: string;
  category?: string;
  paymentMethod?: "cash" | "bank" | "maya" | "gcash";
  accountNumber?: string;
  bankName?: string;
  accountName?: string;
  qrImage?: string;
  splitWith: string[];
  activityId?: string;
}

interface UpdateExpenseRequest {
  paidBy?: string;
  amount?: number;
  description?: string;
  date?: string;
  category?: string;
  paymentMethod?: "cash" | "bank" | "maya" | "gcash";
  accountNumber?: string;
  bankName?: string;
  accountName?: string;
  qrImage?: string;
  splitWith?: string[];
  activityId?: string;
}

/**
 * Query hook to fetch expenses for a trip
 */
export function useExpenses(tripId: string | null) {
  return useQuery<ExpensesResponse, Error>({
    queryKey: queryKeys.expenses.trip(tripId),
    queryFn: async () => {
      const response = await api.get<ExpensesResponse>(
        `/trips/${tripId}/expenses`,
      );
      return response.data;
    },
    enabled: !!tripId,
  });
}

/**
 * Mutation hook to create a new expense
 */
export function useCreateExpense(tripId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<ExpenseResponse, Error, CreateExpenseRequest>({
    mutationFn: async (data) => {
      const response = await api.post<ExpenseResponse>(
        `/trips/${tripId}/expenses`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate expenses query
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.trip(tripId) });
      // Also invalidate group query to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      // Toast will be shown via Socket.IO event to avoid duplicates
    },
  });
}

/**
 * Mutation hook to update an expense
 */
export function useUpdateExpense(
  tripId: string,
  expenseId: string,
  groupId: string,
) {
  const queryClient = useQueryClient();

  return useMutation<ExpenseResponse, Error, UpdateExpenseRequest>({
    mutationFn: async (data) => {
      const response = await api.patch<ExpenseResponse>(
        `/trips/${tripId}/expenses/${expenseId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate expenses query
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.trip(tripId) });
      // Also invalidate group query to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      // Toast will be shown via Socket.IO event to avoid duplicates
    },
  });
}

/**
 * Mutation hook to delete an expense
 */
export function useDeleteExpense(
  tripId: string | null,
  expenseId: string,
  groupId: string,
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
    },
    onSuccess: () => {
      // Invalidate expenses query
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.trip(tripId) });
      // Also invalidate payment logs since deleting expense removes its logs
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentLogs.trip(tripId) });
      // Also invalidate group query to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      // Toast will be shown via Socket.IO event to avoid duplicates
    },
  });
}

/**
 * Query hook to fetch payment logs for a trip
 */
export function usePaymentLogs(tripId: string | null) {
  return useQuery<PaymentLogsResponse, Error>({
    queryKey: queryKeys.paymentLogs.trip(tripId),
    queryFn: async () => {
      const response = await api.get<PaymentLogsResponse>(
        `/trips/${tripId}/payment-logs`,
      );
      return response.data;
    },
    enabled: !!tripId,
  });
}

type PaymentStatus = "confirmed" | "rejected";

/** A payment changes the expense, adds to the payment log and moves the group's balances. */
function invalidatePayment(queryClient: QueryClient, tripId: string | null, groupId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.expenses.trip(tripId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.paymentLogs.trip(tripId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
}

/**
 * Mutation hook for marking a member's share of an expense as paid (the variable is their email).
 * The expense shows the member as paid straight away; the refetch afterwards corrects it either way.
 */
export function useMarkPaid(tripId: string | null, expenseId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (memberEmail) => {
      await api.post(`/trips/${tripId}/expenses/${expenseId}/payments`, {
        memberEmail,
        isPaid: true,
      });
    },
    onMutate: async (memberEmail) => {
      const key = queryKeys.expenses.trip(tripId);
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData<ExpensesResponse>(key, (old) =>
        old
          ? {
              ...old,
              expenses: old.expenses.map((e) =>
                e.id === expenseId ? { ...e, paidMembers: [...(e.paidMembers || []), memberEmail] } : e,
              ),
            }
          : old,
      );
    },
    onSettled: () => invalidatePayment(queryClient, tripId, groupId),
  });
}

/**
 * Mutation hook for the creator or payer reversing a guest split member's recorded payment
 * (a guest has no account, so this is the same endpoint `useMarkPaid` posts to, with isPaid false).
 */
export function useUndoGuestPayment(tripId: string | null, expenseId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (member) => {
      await api.post(`/trips/${tripId}/expenses/${expenseId}/payments`, {
        memberEmail: member,
        isPaid: false,
      });
    },
    onSuccess: () => invalidatePayment(queryClient, tripId, groupId),
  });
}

/** Mutation hook for the payer confirming or rejecting a member's payment. */
export function useConfirmPayment(tripId: string | null, expenseId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { memberEmail: string; status: PaymentStatus }>({
    mutationFn: async ({ memberEmail, status }) => {
      await api.post(`/trips/${tripId}/expenses/${expenseId}/payments/confirm`, {
        memberEmail,
        status,
      });
    },
    onSuccess: () => invalidatePayment(queryClient, tripId, groupId),
  });
}
