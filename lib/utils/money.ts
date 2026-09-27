import { z } from "zod";

/** Whole pesos with thousands separators, e.g. ₱20,900. For totals and expense amounts. */
export function formatPeso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString("en-US")}`;
}

/** Pesos and centavos with thousands separators, e.g. ₱1,780.40. For shares and anything owed or paid back. */
export function formatPesoExact(amount: number): string {
  return `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Pesos to whole centavos, rounding half up (12.345 → 1235). */
export function toCents(pesos: number): number {
  // toPrecision(15) drops binary float noise (12.345 * 100 is 1234.4999…) before rounding.
  return Math.round(Number((pesos * 100).toPrecision(15)));
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * A request amount in pesos: coerced so "12.5" works, rounded to the centavo (money columns are `Decimal(12,2)`),
 * and positive after rounding. null/""/0 become 0 and fail `positive`.
 */
export const pesoAmountSchema = z.coerce
  .number({ error: "Amount must be a number" })
  .transform((pesos) => fromCents(toCents(pesos)))
  .pipe(z.number().positive("Amount must be a positive number").max(9_999_999_999.99, "Amount is too large"));

/**
 * Splits an amount equally between the people in a split, in whole centavos, so the shares always add up
 * to the amount exactly.
 *
 * Everyone gets floor(amount / n). The leftover centavos (always fewer than n) go one each: first to the
 * payer when they are in the split, then to the other participants in list order. So ₱100 between three
 * people is 33.34 / 33.33 / 33.33, and when the payer is one of them the extra centavo is theirs, so
 * everyone who owes the payer owes the same amount.
 *
 * An empty split means nobody shares the cost: the result is empty and nobody owes the payer anything.
 * Participants are identified however the caller identifies members (email or guest name); `payer` is
 * matched against them by equality, and only its first occurrence counts.
 *
 * @returns one share in centavos per participant, in the same order as `participants`.
 */
export function computeShares(amountCents: number, participants: readonly string[], payer?: string): number[] {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
    throw new RangeError(`amountCents must be a whole, non-negative number of centavos, got ${amountCents}`);
  }
  const count = participants.length;
  if (count === 0) return [];

  const base = Math.floor(amountCents / count);
  const shares = participants.map(() => base);
  let leftover = amountCents - base * count;

  const payerIndex = payer === undefined ? -1 : participants.indexOf(payer);
  if (payerIndex !== -1 && leftover > 0) {
    shares[payerIndex] += 1;
    leftover -= 1;
  }
  for (let index = 0; leftover > 0; index++) {
    if (index === payerIndex) continue;
    shares[index] += 1;
    leftover -= 1;
  }
  return shares;
}
