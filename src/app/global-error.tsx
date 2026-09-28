"use client";

import "./globals.css";

// Replaces the root layout entirely when an error escapes it (or the layout itself throws),
// so it can't rely on any provider the crashed layout would normally supply — kept minimal
// and self-contained on purpose.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang='en'>
      <body className='min-h-screen bg-slate-950 text-slate-200 antialiased'>
        <main className='flex min-h-screen items-center justify-center p-6'>
          <div className='mx-auto max-w-md rounded-[22px] border border-[rgba(248,113,113,.25)] bg-[rgba(15,23,42,.6)] p-10 text-center'>
            <h2 className='mb-2 text-xl font-bold'>Something went wrong</h2>
            <p className='mb-6 text-[#94a3b8]'>
              {error.digest ? `Error reference: ${error.digest}` : "The app failed to load. Please try again."}
            </p>
            <button
              type='button'
              onClick={reset}
              className='inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/[.14] bg-white/[.03] px-[18px] py-[11px] text-sm font-semibold text-[#e2e8f0]'
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
