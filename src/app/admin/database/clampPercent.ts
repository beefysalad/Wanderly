/** Clamps a usage percentage to the 0-100 range a meter bar's width can actually render. */
export function clampPercent(percent: number): number {
  return Math.min(100, Math.max(0, percent));
}
