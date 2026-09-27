import { computeShares, fromCents, toCents } from "@/lib/utils/money";

/**
 * Each ticked person's share (pesos, aligned with `splitWith`) while the form is being filled in. The server
 * stores splits in `splitWith` order and runs the same `computeShares` with the same payer, so the preview is
 * exactly what the expense list and detail pages show once it's saved. A blank or invalid amount previews as 0.
 */
export function previewShares(amount: string, splitWith: string[], paidBy: string): number[] {
  const cents = toCents(Number(amount));
  const usable = Number.isSafeInteger(cents) && cents > 0 ? cents : 0;
  return computeShares(usable, splitWith, paidBy).map(fromCents);
}
