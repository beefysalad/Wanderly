import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Expense, PaymentLog } from "@/src/shared/types";

interface ExpensesResponse {
  expenses: Expense[];
}

interface ExpenseResponse {
  expense: Expense;
}

interface PaymentLogsResponse {
  paymentLogs: PaymentLog[];
}

interface PaymentLogResponse {
  paymentLog: PaymentLog;
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

interface MarkExpensePaidRequest {
  memberEmail: string;
  isPaid: boolean;
  createPaymentLog?: boolean;
}

/**
 * Query hook to fetch expenses for a trip
 */
export function useExpenses(tripId: string) {
  return useQuery<ExpensesResponse, Error>({
    queryKey: ["expenses", tripId],
    queryFn: async () => {
      const response = await api.get<ExpensesResponse>(
        `/trips/${tripId}/expenses`
      );
      return response.data;
    },
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
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate expenses query
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      // Also invalidate group query to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

/**
 * Mutation hook to update an expense
 */
export function useUpdateExpense(
  tripId: string,
  expenseId: string,
  groupId: string
) {
  const queryClient = useQueryClient();

  return useMutation<ExpenseResponse, Error, UpdateExpenseRequest>({
    mutationFn: async (data) => {
      const response = await api.patch<ExpenseResponse>(
        `/trips/${tripId}/expenses/${expenseId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate expenses query
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      // Also invalidate group query to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

/**
 * Mutation hook to delete an expense
 */
export function useDeleteExpense(
  tripId: string,
  expenseId: string,
  groupId: string
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
    },
    onSuccess: () => {
      // Invalidate expenses query
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      // Also invalidate payment logs since deleting expense removes its logs
      queryClient.invalidateQueries({ queryKey: ["paymentLogs", tripId] });
      // Also invalidate group query to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

/**
 * Mutation hook to mark/unmark a member as paid for an expense
 */
export function useMarkExpensePaid(
  tripId: string,
  expenseId: string,
  groupId: string
) {
  const queryClient = useQueryClient();

  return useMutation<ExpenseResponse, Error, MarkExpensePaidRequest>({
    mutationFn: async (data) => {
      const response = await api.post<ExpenseResponse>(
        `/trips/${tripId}/expenses/${expenseId}/payments`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate expenses query
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      // Invalidate payment logs if payment log was created
      queryClient.invalidateQueries({ queryKey: ["paymentLogs", tripId] });
      // Also invalidate group query to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

/**
 * Query hook to fetch payment logs for a trip
 */
export function usePaymentLogs(tripId: string) {
  return useQuery<PaymentLogsResponse, Error>({
    queryKey: ["paymentLogs", tripId],
    queryFn: async () => {
      const response = await api.get<PaymentLogsResponse>(
        `/trips/${tripId}/payment-logs`
      );
      return response.data;
    },
  });
}

/**
 * Mutation hook to create a payment log
 */
export function useCreatePaymentLog(tripId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    PaymentLogResponse,
    Error,
    {
      expenseId: string;
      payerEmail: string;
      payeeEmail: string;
      amount: number;
      paymentMethod?: "bank" | "maya" | "gcash";
    }
  >({
    mutationFn: async (data) => {
      const response = await api.post<PaymentLogResponse>(
        `/trips/${tripId}/payment-logs`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate payment logs query
      queryClient.invalidateQueries({ queryKey: ["paymentLogs", tripId] });
      // Also invalidate group query to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

interface ConfirmPaymentRequest {
  memberEmail: string;
  status: "confirmed" | "rejected";
}

/**
 * Mutation hook to confirm or reject a pending payment
 */
export function useConfirmPayment(
  tripId: string,
  expenseId: string,
  groupId: string
) {
  const queryClient = useQueryClient();

  return useMutation<ExpenseResponse, Error, ConfirmPaymentRequest>({
    mutationFn: async (data) => {
      const response = await api.post<ExpenseResponse>(
        `/trips/${tripId}/expenses/${expenseId}/payments/confirm`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate expenses query
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      // Invalidate payment logs if payment was confirmed
      queryClient.invalidateQueries({ queryKey: ["paymentLogs", tripId] });
      // Also invalidate group query to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

