"use client";

import { PILL } from "./components/shared/Pills";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className='flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-200'>
      <div className='mx-auto max-w-md rounded-[22px] border border-[rgba(248,113,113,.25)] bg-[rgba(15,23,42,.6)] p-10 text-center'>
        <h2 className='mb-2 text-xl font-bold'>Something went wrong</h2>
        <p className='mb-6 text-[#94a3b8]'>
          {error.digest ? `Error reference: ${error.digest}` : "An unexpected error occurred. Please try again."}
        </p>
        <button type='button' onClick={reset} className={PILL.ghost}>
          Try again
        </button>
      </div>
    </main>
  );
}
