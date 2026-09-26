import { formatPeso } from "@/lib/utils/money";
import type { Expense } from "@/src/shared/types";

export type MemberStatus = "paid" | "confirmed" | "pending" | "rejected" | "unpaid";

export const STATUS_STYLE: Record<MemberStatus, { label: string; pill: string }> = {
  paid: { label: "Paid", pill: "border-[rgba(251,191,36,.3)] bg-[rgba(251,191,36,.1)] text-[#fbbf24]" },
  confirmed: { label: "Confirmed", pill: "border-[rgba(52,211,153,.3)] bg-[rgba(52,211,153,.1)] text-[#34d399]" },
  pending: { label: "Pending", pill: "border-[rgba(252,211,77,.3)] bg-[rgba(252,211,77,.08)] text-[#fcd34d]" },
  rejected: { label: "Rejected", pill: "border-[rgba(248,113,113,.3)] bg-[rgba(248,113,113,.1)] text-[#f87171]" },
  unpaid: { label: "Unpaid", pill: "border-[rgba(148,163,184,.25)] bg-[rgba(148,163,184,.1)] text-[#cbd5e1]" },
};

export const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  bank: "Bank transfer",
  gcash: "GCash",
  maya: "Maya",
};

/** Everyone the expense is split with, or every member when it wasn't narrowed down. */
export function splitMembers(expense: Expense, members: string[]): string[] {
  const split = expense.splitWith?.length ? expense.splitWith : members;
  // The payer is always part of the list so their row shows "Paid".
  return split.includes(expense.paidBy) ? split : [expense.paidBy, ...split];
}

export function memberStatus(expense: Expense, member: string): MemberStatus {
  if (member === expense.paidBy) return "paid";
  if (expense.paidMembers?.includes(member)) return "confirmed";
  const mapped = expense.paymentStatusMap?.[member];
  if (mapped === "confirmed") return "confirmed";
  if (mapped === "pending" || expense.pendingPayments?.includes(member)) return "pending";
  if (mapped === "rejected") return "rejected";
  return "unpaid";
}

/** Equal share per person of the people actually splitting it (the payer's own share included). */
export function shareOf(expense: Expense, members: string[]): number {
  const count = expense.splitWith?.length || members.length || 1;
  return expense.amount / count;
}

/** How many of the people who owe the payer have paid (confirmed), out of how many owe. */
export function paidBack(expense: Expense, members: string[]): { done: number; total: number; percent: number } {
  const owing = splitMembers(expense, members).filter((member) => member !== expense.paidBy);
  const done = owing.filter((member) => memberStatus(expense, member) === "confirmed").length;
  return { done, total: owing.length, percent: owing.length ? (done / owing.length) * 100 : 100 };
}

export interface ShareBox {
  title: string;
  amount: string;
  note: string;
  /** True when "I've paid my share" makes sense. */
  canMark: boolean;
}

/** The amber box on the side: what this expense means for the current user, and what to do about it. */
export function shareBox(expense: Expense, members: string[], userEmail: string, payerShort: string): ShareBox {
  const share = shareOf(expense, members);
  const method = METHOD_LABEL[expense.paymentMethod ?? ""] ?? "your usual method";
  const owing = splitMembers(expense, members).filter((member) => member !== expense.paidBy);
  const open = owing.filter((member) => memberStatus(expense, member) !== "confirmed").length;

  if (userEmail === expense.paidBy) {
    return {
      title: "You paid",
      amount: formatPeso(expense.amount),
      note: open
        ? `${formatPeso(open * share)} still to collect from ${open} ${open === 1 ? "person" : "people"}.`
        : "Everyone has paid you back.",
      canMark: false,
    };
  }

  if (!splitMembers(expense, members).includes(userEmail)) {
    return { title: "Not in this split", amount: "—", note: "You are not sharing this cost.", canMark: false };
  }

  const status = memberStatus(expense, userEmail);
  const amount = formatPeso(share);
  if (status === "confirmed") return { title: "Your share", amount, note: `Settled. ${payerShort} confirmed your payment.`, canMark: false };
  if (status === "pending") return { title: "Your share", amount, note: `Marked as paid. Waiting for ${payerShort} to confirm.`, canMark: false };
  return { title: "Your share", amount, note: `Send it to ${payerShort} via ${method}, then let them know here.`, canMark: true };
}
