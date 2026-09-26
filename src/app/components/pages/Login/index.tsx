"use client";

import { motion } from "framer-motion";
import { Clock, Users, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { AuthItem } from "../../shared/AuthForm/AuthParts";
import SignInForm from "../../shared/AuthForm/SignInForm";
import { EASE } from "../../shared/Site/motion";

const UPDATES: { icon: ReactNode; text: ReactNode }[] = [
  {
    icon: <Users className='size-[15px] flex-none text-[#34d399]' />,
    text: (
      <>
        RC joined with code <strong className='font-mono text-[#fbbf24]'>7XK2QD</strong>
      </>
    ),
  },
  {
    icon: <Clock className='size-[15px] flex-none text-[#fbbf24]' />,
    text: (
      <>
        Day 2 pickup moved to <strong className='text-[#f8fafc]'>6:30 AM</strong>
      </>
    ),
  },
  {
    icon: <Wallet className='size-[15px] flex-none text-[#fb923c]' />,
    text: (
      <>
        MJ logged the van — you owe <strong className='text-[#fb923c]'>₱1,200</strong>
      </>
    ),
  },
];

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const signUpHref = redirectUrl !== "/dashboard" ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register";

  return (
    <main className='relative grid min-h-screen grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] bg-[#020617] font-[family-name:var(--font-geist-sans)] leading-[normal] text-[#f8fafc]'>
      {/* Left: a glimpse of what a trip looks like from the inside. Below two columns it drops under the form. */}
      <div className='relative z-[1] order-2 flex min-w-0 flex-col justify-between gap-[clamp(32px,5vw,56px)] overflow-hidden border-r border-white/[.06] bg-[rgba(15,23,42,.35)] px-[clamp(24px,5vw,64px)] py-[clamp(28px,4vw,56px)] min-[680px]:order-1'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(148,163,184,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.05)_1px,transparent_1px)] [background-size:64px_64px] [-webkit-mask-image:radial-gradient(ellipse_80%_70%_at_20%_10%,#000_20%,transparent_75%)] [mask-image:radial-gradient(ellipse_80%_70%_at_20%_10%,#000_20%,transparent_75%)]'
        />

        <AuthItem index={0} className='relative'>
          <Link href='/' className='flex items-center gap-[10px] text-inherit'>
            <Image src='/wanderly.png' alt='Wanderly' width={32} height={32} className='size-8 object-contain' />
            <span className='text-[19px] font-extrabold tracking-[-.02em] text-[#f8fafc]'>Wanderly</span>
          </Link>
        </AuthItem>

        <div className='relative max-w-[30em]'>
          <AuthItem index={1}>
            <p className='mb-[14px] font-mono text-[11px] uppercase tracking-[.2em] text-[#fbbf24]'>Since you left</p>
          </AuthItem>
          <AuthItem index={2}>
            <h2 className='mb-[26px] text-[clamp(28px,3.6vw,44px)] font-extrabold leading-[1.05] tracking-[-.03em]'>
              Three things moved
              <br />
              while you were away.
            </h2>
          </AuthItem>
          <div className='flex flex-col gap-[10px]'>
            {UPDATES.map((update, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: 0.45 + index * 0.1, ease: EASE }}
                className='flex items-center gap-3 rounded-[14px] border border-white/[.07] bg-[rgba(2,6,23,.6)] px-[15px] py-[13px]'
              >
                {update.icon}
                <span className='min-w-0 text-sm text-[#cbd5e1]'>{update.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className='relative z-[1] order-1 flex min-w-0 flex-col justify-center px-[clamp(24px,5vw,64px)] py-[clamp(40px,6vw,72px)] min-[680px]:order-2'>
        <SignInForm
          firstIndex={3}
          signUpHref={signUpHref}
          onAuthSuccess={() => router.push(redirectUrl)}
        />
      </div>
    </main>
  );
};

export default LoginPage;
