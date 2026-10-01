import { Clock, MapPin, TriangleAlert } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { mapsSearchUrl } from "../tripView";

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

/**
 * The line under an activity's title with its place (a Google Maps link) and, when its time clashes
 * with another activity that day, an "Overlaps" flag. Renders nothing when there's neither.
 */
export function ActivityExtras({ location, overlaps }: { location?: string; overlaps: boolean }) {
  if (!location && !overlaps) return null;

  return (
    <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1'>
      {overlaps ? (
        <span className='inline-flex flex-none items-center gap-1 rounded-md border border-[rgba(248,113,113,.35)] bg-[rgba(248,113,113,.1)] px-[6px] py-[2px] font-mono text-[10px] uppercase tracking-[.08em] text-[#fca5a5]'>
          <TriangleAlert className='size-[11px]' />
          Overlaps
        </span>
      ) : null}
      {location ? (
        <a
          href={mapsSearchUrl(location)}
          target='_blank'
          rel='noopener noreferrer'
          aria-label={`Open ${location} in Google Maps`}
          className='inline-flex min-w-0 items-center gap-1 py-1 text-xs text-[#93c5fd] hover:underline'
        >
          <MapPin className='size-3 flex-none' />
          <span className='truncate'>{location}</span>
        </a>
      ) : null}
    </div>
  );
}
