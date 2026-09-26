import type { ReactNode } from "react";

interface PageHeadingProps {
  /** Small mono line above the title, e.g. "Across 4 groups". */
  eyebrow: string;
  title: string;
  /** Pills on the right (wrap below the title on a phone). */
  actions?: ReactNode;
}

/** The mono eyebrow and big title that open every top-level page. */
export function PageHeading({ eyebrow, title, actions }: PageHeadingProps) {
  return (
    <div className='flex flex-wrap items-end justify-between gap-5'>
      <div>
        <p className='mb-[10px] font-mono text-[11px] uppercase tracking-[.18em] text-[#64748b]'>{eyebrow}</p>
        <h1 className='text-[clamp(32px,4.6cqw,48px)] font-extrabold leading-none tracking-[-.035em]'>{title}</h1>
      </div>
      {actions ? <div className='flex flex-wrap gap-[10px]'>{actions}</div> : null}
    </div>
  );
}
