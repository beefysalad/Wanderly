"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import GroupCodeForm from "./components/GroupCodeForm";
import GuestNameForm from "./components/GuestNameForm";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function GuestJoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<"code" | "name">("code");
  const [groupCode, setGroupCode] = useState<string>("");

  return (
    <div className='min-h-screen w-full lg:grid lg:grid-cols-2 bg-slate-950'>
      {/* Left Column: Image Hero */}
      <div className='hidden lg:block relative w-full h-full overflow-hidden bg-slate-900'>
        <div className='absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent z-10'></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src='/images/register-hero.png'
          alt='Beautiful scenery'
          className='object-cover w-full h-full scale-105 animate-float-slow'
        />
        <div className='absolute bottom-12 left-12 right-12 z-20'>
          <div className='bg-slate-950/40 backdrop-blur-md border border-white/10 shadow-2xl p-6 rounded-2xl'>
            <h2 className='text-3xl font-bold text-white mb-2 tracking-tight'>
              Wanderly Guest
            </h2>
            <p className='text-slate-300 text-lg'>
              Join your friends&apos; upcoming trips instantly. No account
              required.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className='flex flex-col items-center justify-center px-4 py-8 md:px-6 relative overflow-hidden min-h-screen lg:min-h-full'>
        {/* Refined Background Gradient */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse'></div>
          <div
            className='absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] animate-pulse'
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div
          className='absolute inset-0 opacity-[0.02] pointer-events-none'
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
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
                Join as Guest
              </h1>
              <p className='text-slate-400 text-base md:text-lg'>
                {step === "code"
                  ? "Enter the trip code to join"
                  : "What should we call you?"}
              </p>
            </div>

            {/* Subtle Divider */}
            <div className='h-px bg-gradient-to-r from-transparent via-white/10 to-transparent'></div>

            {/* Form */}
            <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
              {step === "code" ? (
                <GroupCodeForm
                  onClose={() => router.push("/")}
                  setStep={setStep}
                  setGroupCode={setGroupCode}
                />
              ) : (
                <GuestNameForm setStep={setStep} groupCode={groupCode} />
              )}
            </div>

            {/* Footer */}
            <div className='pt-8'>
              <div className='h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8'></div>
              <p className='text-center text-slate-400 text-sm md:text-base'>
                Want to create your own trip?{" "}
                <Link
                  href='/register'
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
    </div>
  );
}
