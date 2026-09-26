/** Whole pesos with thousands separators, e.g. ₱20,900. */
export function formatPeso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString("en-US")}`;
}
