import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";
import { PILL, PillLink } from "../Pills";
import { loadErrorCopy, loadFailure, type QueryLike } from "./loadError";

interface MessageProps {
  variant?: "message";
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

interface ErrorProps {
  variant: "error";
  /** The query that failed; "Try again" refetches it. */
  query: QueryLike;
  /** What couldn't be loaded, e.g. "this trip". */
  what: string;
  /** Where "Sign in" goes when the session ended; guests re-enter their group code instead. */
  signInHref?: string;
}

export type StateMessageProps = MessageProps | ErrorProps;

const CARD = "mx-auto max-w-md rounded-[22px] border bg-[rgba(15,23,42,.6)] p-10 text-center";

/**
 * A centred "not found" / "missing" / "couldn't load" card. It has no chrome of its own, so the
 * signed-in pages (via `StateCard`), the guest pages (inside `GuestShell`) and the trip tabs all
 * share it.
 */
export function StateMessage(props: StateMessageProps) {
  if (props.variant === "error") return <ErrorMessage {...props} />;

  const { title, body, actionLabel, onAction, children } = props;
  return (
    <div className={cn(CARD, "border-white/[.08]")}>
      <h2 className='mb-2 text-xl font-bold'>{title}</h2>
      {body ? <p className='mb-6 text-[#94a3b8]'>{body}</p> : null}
      {children}
      {actionLabel && onAction ? (
        <button type='button' onClick={onAction} className={PILL.ghost}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function ErrorMessage({ query, what, signInHref = "/login" }: ErrorProps) {
  const failure = loadFailure(query.error);
  const copy = loadErrorCopy(failure === "missing" ? "failed" : failure, what);

  return (
    <div role='alert' className={cn(CARD, "border-[rgba(248,113,113,.25)]")}>
      <span className='mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-[rgba(248,113,113,.12)] text-[#fca5a5]'>
        <AlertTriangle className='size-5' />
      </span>
      <h2 className='mb-2 text-xl font-bold'>{copy.title}</h2>
      <p className='mb-6 text-[#94a3b8]'>{copy.body}</p>
      {copy.action === "sign-in" ? (
        <PillLink href={signInHref} variant='ghost'>
          Sign in
        </PillLink>
      ) : (
        <button type='button' onClick={() => query.refetch()} disabled={query.isFetching} className={PILL.ghost}>
          {query.isFetching ? "Trying again…" : "Try again"}
        </button>
      )}
    </div>
  );
}
