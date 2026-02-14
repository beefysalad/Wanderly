"use client";

import SignInForm from "@/src/app/components/shared/AuthForm/SignInForm";
import Link from "next/link";
import { Compass } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const handleAuthSuccess = () => {
    router.push(redirectUrl);
  };

  return (
    <div className='min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000'></div>
      </div>

      <div className='w-full max-w-md z-10'>
        {/* Logo */}
        <div className='flex flex-col items-center mb-8'>
          <div className='relative mb-4'>
            <div className='absolute inset-0 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl blur-lg opacity-50'></div>
            <div className='relative w-16 h-16 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl'>
              <Compass className='w-8 h-8 text-purple-950' />
            </div>
          </div>
          <h1 className='text-3xl font-bold text-white mb-2'>Welcome Back</h1>
          <p className='text-slate-400 text-center'>
            Sign in to continue your journey
          </p>
        </div>

        {/* Form Container */}
        <div className='bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl'>
          <SignInForm onAuthSuccess={handleAuthSuccess} />

          <div className='mt-6 text-center text-sm text-slate-400'>
            Don&apos;t have an account?{" "}
            <Link
              href={`/register${
                redirectUrl !== "/dashboard"
                  ? `?redirect=${encodeURIComponent(redirectUrl)}`
                  : ""
              }`}
              className='text-amber-400 hover:text-amber-300 font-medium transition-colors'
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
