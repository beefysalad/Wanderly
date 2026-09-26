import { cn } from "@/lib/utils";
import { getGroupTheme } from "@/lib/utils/groupTheme";

interface GroupPreviewProps {
  name: string;
  emoji: string | null;
  vibeName: string;
  colorScheme: string;
}

/** How the new group will look in the sidebar and on the groups page, updated as you type. */
export function GroupPreview({ name, emoji, vibeName, colorScheme }: GroupPreviewProps) {
  const theme = getGroupTheme(colorScheme);
  const trimmed = name.trim();

  return (
    <div className='flex min-w-0 flex-[1_1_260px] flex-col gap-[10px]'>
      <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>Live preview</span>
      <div className='flex flex-col gap-[18px] rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[18px]'>
        <span className={cn("flex size-12 items-center justify-center rounded-[15px] border text-2xl", theme.tile)}>
          {emoji}
        </span>
        <span className='flex flex-col gap-1'>
          <span className={cn("font-mono text-[10px] uppercase tracking-[.14em]", theme.text)}>{vibeName}</span>
          <span
            className={cn(
              "text-xl font-extrabold tracking-[-.02em] [overflow-wrap:anywhere]",
              trimmed ? "text-[#f8fafc]" : "text-[#475569]",
            )}
          >
            {trimmed || "New adventure"}
          </span>
          <span className='text-[13px] text-[#94a3b8]'>1 member · 0 trips</span>
        </span>
      </div>
    </div>
  );
}
