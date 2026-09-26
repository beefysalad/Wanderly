import type { ReactNode } from "react";
import { AppShell } from "./AppShell";

interface FormPageProps {
  back: { href: string; crumb: string };
  /** Small mono line above the title, e.g. "Siargao · Paraluman". */
  eyebrow?: string;
  title: string;
  children: ReactNode;
  /** Max width of the form column, in px (a form reads best narrow). */
  width?: "sm" | "md";
}

const WIDTH = { sm: "max-w-[560px]", md: "max-w-[640px]" };

/** A signed-in form page: back button, title, and a centred form column. */
export function FormPage({ back, eyebrow, title, children, width = "md" }: FormPageProps) {
  return (
    <AppShell level='detail' back={back}>
      <div className={`mx-auto flex flex-col gap-[22px] ${WIDTH[width]}`}>
        <div>
          {eyebrow ? (
            <p className='mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>{eyebrow}</p>
          ) : null}
          <h1 className='text-[clamp(28px,4.4cqw,40px)] font-extrabold leading-[1.05] tracking-[-.03em]'>{title}</h1>
        </div>
        {children}
      </div>
    </AppShell>
  );
}
