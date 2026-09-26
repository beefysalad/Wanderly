import type { ReactNode } from "react";

interface StepHeaderProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
}

export function StepHeader({ eyebrow, title, subtitle }: StepHeaderProps) {
  return (
    <div>
      <p className='mb-[10px] font-mono text-[10px] uppercase tracking-[.18em] text-[#64748b]'>{eyebrow}</p>
      <h2 className={`text-[clamp(30px,5cqw,40px)] font-extrabold leading-[1.05] tracking-[-.03em] ${subtitle ? "mb-2" : ""}`}>
        {title}
      </h2>
      {subtitle ? <p className='text-base text-[#94a3b8]'>{subtitle}</p> : null}
    </div>
  );
}
