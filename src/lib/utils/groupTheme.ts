import type { ColorScheme } from "./groupColors";

/**
 * Class strings for a group's vibe colour. They are written out in full (not built from the hex)
 * because Tailwind only generates classes it can find as literal text in the source.
 */
export interface GroupTheme {
  /** The 400-shade hex, for the rare place that needs the raw value. */
  hex: string;
  /** Small solid dot (sidebar list). */
  dot: string;
  text: string;
  /** Emoji tile: about 12% fill with a 25% border. */
  tile: string;
  /** Calendar day tint. */
  cell: string;
  /** Calendar bar under a trip day. */
  bar: string;
}

const THEMES: Record<ColorScheme, GroupTheme> = {
  orange: {
    hex: "#fb923c",
    dot: "bg-[#fb923c]",
    text: "text-[#fb923c]",
    tile: "border-[#fb923c]/25 bg-[#fb923c]/[.12]",
    cell: "bg-[#fb923c]/15",
    bar: "bg-[#fb923c]",
  },
  blue: {
    hex: "#60a5fa",
    dot: "bg-[#60a5fa]",
    text: "text-[#60a5fa]",
    tile: "border-[#60a5fa]/25 bg-[#60a5fa]/[.12]",
    cell: "bg-[#60a5fa]/15",
    bar: "bg-[#60a5fa]",
  },
  green: {
    hex: "#4ade80",
    dot: "bg-[#4ade80]",
    text: "text-[#4ade80]",
    tile: "border-[#4ade80]/25 bg-[#4ade80]/[.12]",
    cell: "bg-[#4ade80]/15",
    bar: "bg-[#4ade80]",
  },
  purple: {
    hex: "#c084fc",
    dot: "bg-[#c084fc]",
    text: "text-[#c084fc]",
    tile: "border-[#c084fc]/25 bg-[#c084fc]/[.12]",
    cell: "bg-[#c084fc]/15",
    bar: "bg-[#c084fc]",
  },
  pink: {
    hex: "#f472b6",
    dot: "bg-[#f472b6]",
    text: "text-[#f472b6]",
    tile: "border-[#f472b6]/25 bg-[#f472b6]/[.12]",
    cell: "bg-[#f472b6]/15",
    bar: "bg-[#f472b6]",
  },
  red: {
    hex: "#f87171",
    dot: "bg-[#f87171]",
    text: "text-[#f87171]",
    tile: "border-[#f87171]/25 bg-[#f87171]/[.12]",
    cell: "bg-[#f87171]/15",
    bar: "bg-[#f87171]",
  },
  amber: {
    hex: "#fbbf24",
    dot: "bg-[#fbbf24]",
    text: "text-[#fbbf24]",
    tile: "border-[#fbbf24]/25 bg-[#fbbf24]/[.12]",
    cell: "bg-[#fbbf24]/15",
    bar: "bg-[#fbbf24]",
  },
  emerald: {
    hex: "#34d399",
    dot: "bg-[#34d399]",
    text: "text-[#34d399]",
    tile: "border-[#34d399]/25 bg-[#34d399]/[.12]",
    cell: "bg-[#34d399]/15",
    bar: "bg-[#34d399]",
  },
  indigo: {
    hex: "#818cf8",
    dot: "bg-[#818cf8]",
    text: "text-[#818cf8]",
    tile: "border-[#818cf8]/25 bg-[#818cf8]/[.12]",
    cell: "bg-[#818cf8]/15",
    bar: "bg-[#818cf8]",
  },
  cyan: {
    hex: "#22d3ee",
    dot: "bg-[#22d3ee]",
    text: "text-[#22d3ee]",
    tile: "border-[#22d3ee]/25 bg-[#22d3ee]/[.12]",
    cell: "bg-[#22d3ee]/15",
    bar: "bg-[#22d3ee]",
  },
};

export function getGroupTheme(colorScheme?: string): GroupTheme {
  return THEMES[(colorScheme || "orange") as ColorScheme] ?? THEMES.orange;
}
