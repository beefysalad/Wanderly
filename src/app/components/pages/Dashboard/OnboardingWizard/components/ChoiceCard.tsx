import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChoiceCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Vibes use a small mono caption; crews use a plain sentence. */
  mono?: boolean;
  selected: boolean;
  onClick: () => void;
}

/** A selectable option: amber outline and a check badge when picked. */
export function ChoiceCard({ icon: Icon, title, subtitle, mono = false, selected, onClick }: ChoiceCardProps) {
  return (
    <button
      type='button'
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer flex-col gap-[14px] rounded-[18px] border p-[18px] text-left",
        selected
          ? "border-[rgba(251,191,36,.55)] bg-[rgba(251,191,36,.08)]"
          : "border-white/[.08] bg-[rgba(15,23,42,.6)]",
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl",
          selected ? "bg-[rgba(251,191,36,.14)] text-[#fbbf24]" : "bg-white/[.04] text-[#94a3b8]",
        )}
      >
        <Icon className='size-5' />
      </span>
      <span className='flex flex-col gap-1'>
        <span className={cn("text-base font-bold", selected ? "text-[#f8fafc]" : "text-[#e2e8f0]")}>{title}</span>
        <span
          className={cn(
            mono
              ? "font-mono text-[10px] uppercase tracking-[.12em] text-[#64748b]"
              : "text-[13px] text-[#94a3b8]",
          )}
        >
          {subtitle}
        </span>
      </span>
      {selected ? (
        <span className='absolute right-[14px] top-[14px] flex size-[22px] items-center justify-center rounded-full bg-[#fbbf24] text-[#160c02]'>
          <Check className='size-[13px]' strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}
