import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/** The round tick beside an activity; green once it's done. Read-only viewers get a plain circle. */
export function TickButton({ done, onToggle, label }: { done: boolean; onToggle?: () => void; label: string }) {
  const classes = cn(
    "flex size-6 flex-none items-center justify-center rounded-full border-2 p-0 text-xs font-bold",
    done ? "border-[rgba(52,211,153,.55)] bg-[rgba(52,211,153,.18)] text-[#34d399]" : "border-[#475569] text-transparent",
  );

  if (!onToggle) {
    return (
      <span className={classes} aria-hidden>
        ✓
      </span>
    );
  }

  return (
    <button
      type='button'
      aria-pressed={done}
      aria-label={done ? `Mark "${label}" not done` : `Mark "${label}" done`}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={cn(classes, "cursor-pointer")}
    >
      ✓
    </button>
  );
}

/** The small mono "🕐 6:30 AM" chip. */
export function TimeChip({ time, className }: { time: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex flex-none items-center gap-[6px] rounded-md bg-[rgba(2,6,23,.6)] px-2 py-1 font-mono text-[11px] text-[#cbd5e1]",
        className,
      )}
    >
      <Clock className='size-[11px]' />
      {time}
    </span>
  );
}
