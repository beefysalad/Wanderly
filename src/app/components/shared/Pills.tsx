import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Class strings for the app's pill buttons, for places that need a <button> instead of a link. */
export const PILL = {
  gradient:
    "inline-flex cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(100deg,#fbbf24,#f97316)] px-[18px] py-[11px] text-sm font-extrabold text-[#160c02] shadow-[0_18px_40px_-18px_rgba(251,146,60,.9)] disabled:cursor-not-allowed disabled:opacity-[.45]",
  ghost:
    "inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/[.14] bg-white/[.03] px-[18px] py-[11px] text-sm font-semibold text-[#e2e8f0] disabled:cursor-not-allowed disabled:opacity-[.45]",
  amber:
    "inline-flex cursor-pointer items-center gap-[7px] rounded-full bg-[#fbbf24] px-[14px] py-2 text-[13px] font-bold text-[#0b0a06] disabled:cursor-not-allowed disabled:opacity-[.45]",
} as const;

type PillLinkProps = ComponentProps<typeof Link> & { variant?: keyof typeof PILL };

export function PillLink({ variant = "gradient", className, ...props }: PillLinkProps) {
  return <Link className={cn(PILL[variant], className)} {...props} />;
}
