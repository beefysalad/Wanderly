import type { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { PILL } from "../Pills";

interface StateCardProps {
  back: { href: string; crumb: string };
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

/** A centred "not found" / "missing" message inside the app chrome. */
export function StateCard({ back, title, body, actionLabel, onAction, children }: StateCardProps) {
  return (
    <AppShell level='detail' back={back}>
      <div className='mx-auto max-w-md rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-10 text-center'>
        <h2 className='mb-2 text-xl font-bold'>{title}</h2>
        {body ? <p className='mb-6 text-[#94a3b8]'>{body}</p> : null}
        {children}
        {actionLabel && onAction ? (
          <button type='button' onClick={onAction} className={PILL.ghost}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </AppShell>
  );
}
