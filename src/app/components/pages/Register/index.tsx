"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthItem } from "../../shared/AuthForm/AuthParts";
import SignUpForm from "../../shared/AuthForm/SignUpForm";
import { EASE, useRevealDistance } from "../../shared/Site/motion";

const TRIP = [
  { time: "6:30 AM", title: "🚐 Pickup at hostel", highlighted: false },
  { time: "9:00 AM", title: "⛵ Naked Island", highlighted: true },
  { time: "12:30 PM", title: "🍽️ Lunch — Guyam", highlighted: false },
];

const PERKS = [
  "Unlimited trips and members",
  "Expense splitting with GCash / Maya QR",
  "Guest links for the friends who won't sign up",
];

const RegisterPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const loginHref = redirectUrl !== "/dashboard" ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login";
  const panelY = useRevealDistance(20) + 10;

  const panel = (index: number) => ({
    initial: { opacity: 0, y: panelY, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.8, delay: 0.22 + index * 0.11, ease: EASE },
  });

  return (
    <main className='relative grid min-h-screen grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] bg-[#020617] font-[family-name:var(--font-geist-sans)] leading-[normal] text-[#f8fafc]'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 z-0 [background-image:linear-gradient(rgba(148,163,184,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.05)_1px,transparent_1px)] [background-size:72px_72px] [-webkit-mask-image:radial-gradient(ellipse_80%_60%_at_30%_0%,#000_20%,transparent_70%)] [mask-image:radial-gradient(ellipse_80%_60%_at_30%_0%,#000_20%,transparent_70%)]'
      />

      <div className='relative z-[1] flex min-w-0 flex-col items-center justify-center px-[clamp(24px,5vw,72px)] py-[clamp(32px,5vw,72px)]'>
        <div className='w-full max-w-[420px]'>
          <AuthItem index={0} duration={0.6} className='mb-[clamp(32px,5vw,56px)]'>
            <Link href='/' className='flex items-center gap-[10px] text-inherit'>
              <Image src='/wanderly.png' alt='Wanderly' width={32} height={32} className='size-8 object-contain' />
              <span className='text-[19px] font-extrabold tracking-[-.02em] text-[#f8fafc]'>Wanderly</span>
            </Link>
          </AuthItem>
          <SignUpForm firstIndex={1} loginHref={loginHref} onAuthSuccess={() => router.push(redirectUrl)} />
        </div>
      </div>

      <div className='relative z-[1] flex min-w-0 flex-col items-center justify-center gap-5 border-l border-white/[.06] bg-[rgba(15,23,42,.35)] p-[clamp(32px,5vw,72px)]'>
        <motion.div
          {...panel(0)}
          className='w-full max-w-[520px] rounded-[20px] border border-white/[.08] bg-[rgba(2,6,23,.75)] p-[22px]'
        >
          <p className='mb-1 font-mono text-[10px] uppercase tracking-[.18em] text-[#64748b]'>Your first trip</p>
          <p className='mb-[18px] text-[19px] font-extrabold'>Siargao, finally</p>
          <div className='flex flex-col gap-[9px]'>
            {TRIP.map((item, index) => (
              <motion.div
                key={item.time}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.55 + index * 0.1,
                  ease: EASE,
                }}
                className={`flex items-center gap-[11px] rounded-xl border bg-[rgba(30,41,59,.4)] px-[13px] py-3 ${
                  item.highlighted ? "border-[rgba(251,191,36,.28)]" : "border-white/[.05]"
                }`}
              >
                <span className='flex-none font-mono text-[11px] text-[#cbd5e1]'>{item.time}</span>
                <span className='truncate text-sm font-semibold'>{item.title}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          {...panel(1)}
          className='flex w-full max-w-[520px] flex-col gap-3 rounded-[20px] border border-white/[.08] bg-[rgba(2,6,23,.75)] p-[22px]'
        >
          {PERKS.map((perk) => (
            <div key={perk} className='flex items-center gap-[10px] text-sm text-[#cbd5e1]'>
              <Check className='size-[15px] flex-none text-[#34d399]' />
              {perk}
            </div>
          ))}
        </motion.div>
      </div>
    </main>
  );
};

export default RegisterPage;
