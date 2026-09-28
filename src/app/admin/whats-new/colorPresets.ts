export interface ColorPreset {
  name: string;
  color: string;
  bg: string;
  border: string;
}

/** Palette offered in the admin editor's color picker for a feature card. */
export const COLOR_PRESETS: ColorPreset[] = [
  { name: "Amber", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { name: "Blue", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { name: "Rose", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { name: "Emerald", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { name: "Purple", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { name: "Sky", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  { name: "Indigo", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  { name: "Teal", color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" },
  { name: "Orange", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { name: "Pink", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  { name: "Lime", color: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-500/20" },
  { name: "Cyan", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { name: "Fuchsia", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
  { name: "Slate", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  { name: "Red", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  { name: "Green", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  { name: "Yellow", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  { name: "Violet", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { name: "Zinc", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20" },
];
