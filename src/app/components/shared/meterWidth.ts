// Every class is spelled out so Tailwind can generate it; a bar's length is rounded to the nearest 5%.
const WIDTHS = [
  "w-0",
  "w-[5%]",
  "w-[10%]",
  "w-[15%]",
  "w-[20%]",
  "w-[25%]",
  "w-[30%]",
  "w-[35%]",
  "w-[40%]",
  "w-[45%]",
  "w-[50%]",
  "w-[55%]",
  "w-[60%]",
  "w-[65%]",
  "w-[70%]",
  "w-[75%]",
  "w-[80%]",
  "w-[85%]",
  "w-[90%]",
  "w-[95%]",
  "w-full",
];

/** A width class for a bar that is `percent` (0–100) full. */
export function meterWidth(percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  return WIDTHS[Math.round(clamped / 5)];
}
