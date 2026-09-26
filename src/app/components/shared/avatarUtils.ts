// Class pairs are literal so Tailwind can see them; the person's colour is picked by hashing a stable key.
const PALETTE = [
  "bg-[#f59e0b] text-[#160c02]",
  "bg-[#38bdf8] text-[#06202e]",
  "bg-[#a78bfa] text-[#1c0f33]",
  "bg-[#34d399] text-[#052e1f]",
  "bg-[#fb7185] text-[#2a0710]",
  "bg-[#22d3ee] text-[#042f2e]",
  "bg-[#fbbf24] text-[#160c02]",
];

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function paletteFor(key: string): string {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
