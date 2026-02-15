"use client";

import SignUpForm from "@/src/app/components/shared/AuthForm/SignUpForm";
import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const handleAuthSuccess = () => {
    router.push(redirectUrl);
  };

  return (
    <div className='min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden'>
      {/* Background Effects - More subtle and premium */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[120px]'></div>
        <div className='absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-500/5 rounded-full blur-[120px]'></div>
      </div>

      <div className='w-full max-w-md z-10 relative'>
        {/* Back to Home - Integrated nicely */}
        <Link
          href='/'
          className='absolute -top-16 left-0 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group'
        >
          <div className='p-2 rounded-full bg-white/5 border border-white/5 group-hover:bg-white/10 group-hover:border-white/10 transition-all'>
            <ArrowLeft className='w-4 h-4' />
          </div>
          <span className='text-sm font-medium'>Back</span>
        </Link>

        {/* Content Container */}
        <div className='bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl ring-1 ring-white/5'>
          {/* Header Section */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-white mb-2 tracking-tight'>
              Create account
            </h1>
            <p className='text-slate-400 text-sm'>
              Start planning your adventures today
            </p>
          </div>

          <SignUpForm onAuthSuccess={handleAuthSuccess} />

          <div className='mt-8 pt-6 border-t border-white/5 text-center text-sm text-slate-400'>
            Already have an account?{" "}
            <Link
              href={`/login${
                redirectUrl !== "/dashboard"
                  ? `?redirect=${encodeURIComponent(redirectUrl)}`
                  : ""
              }`}
              className='text-amber-400 hover:text-amber-300 font-medium transition-colors hover:underline underline-offset-4'
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
