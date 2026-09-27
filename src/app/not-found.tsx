import { PillLink } from "./components/shared/Pills";

export default function NotFound() {
  return (
    <main className='flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-200'>
      <div className='mx-auto max-w-md rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-10 text-center'>
        <h2 className='mb-2 text-xl font-bold'>Page not found</h2>
        <p className='mb-6 text-[#94a3b8]'>The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <PillLink href='/' variant='ghost'>
          Go home
        </PillLink>
      </div>
    </main>
  );
}
