"use client";

import SignInForm from "@/src/app/components/shared/AuthForm/SignInForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    <div className='min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-8 md:px-6 relative overflow-hidden'>
      {/* Refined Background Gradient */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse'></div>
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] animate-pulse' style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className='absolute inset-0 opacity-[0.02] pointer-events-none'
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      ></div>

      <div className='w-full max-w-md z-10 relative'>
        {/* Back Button - Clean and Minimal */}
        <Link
          href='/'
          className='inline-flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-200 mb-12 group'
        >
          <ArrowLeft className='w-4 h-4 transition-transform group-hover:-translate-x-1' />
          <span className='text-sm font-medium'>Back</span>
        </Link>

        {/* Main Content - No Card */}
        <div className='space-y-8'>
          {/* Header */}
          <div className='space-y-3'>
            <h1 className='text-4xl md:text-5xl font-bold text-white tracking-tight'>
              Welcome back
            </h1>
            <p className='text-slate-400 text-base md:text-lg'>
              Sign in to continue to your account
            </p>
          </div>

          {/* Subtle Divider */}
          <div className='h-px bg-gradient-to-r from-transparent via-white/10 to-transparent'></div>

          {/* Form */}
          <SignInForm onAuthSuccess={handleAuthSuccess} />

          {/* Footer */}
          <div className='pt-8'>
            <div className='h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8'></div>
            <p className='text-center text-slate-400 text-sm md:text-base'>
              Don&apos;t have an account?{" "}
              <Link
                href={`/register${
                  redirectUrl !== "/dashboard"
                    ? `?redirect=${encodeURIComponent(redirectUrl)}`
                    : ""
                }`}
                className='text-amber-400 hover:text-amber-300 font-semibold transition-colors relative inline-block group'
              >
                Sign up
                <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-300 group-hover:w-full'></span>
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Accent */}
      <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent'></div>
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