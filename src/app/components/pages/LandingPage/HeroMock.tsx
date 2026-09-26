"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clock, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { EASE, useCountUp } from "../../shared/Site/motion";

const AVATARS = [
  { label: "MJ", className: "bg-[#f59e0b] text-[#160c02] font-bold" },
  { label: "RC", className: "-ml-2 bg-[#38bdf8] text-[#06202e] font-bold" },
  { label: "TP", className: "-ml-2 bg-[#a78bfa] text-[#1c0f33] font-bold" },
  { label: "+2", className: "-ml-2 bg-[#1e293b] text-[#94a3b8] font-semibold" },
];

const ACTIVITIES = [
  { time: "6:30 AM", title: "🚐 Pickup at hostel", highlighted: false },
  { time: "9:00 AM", title: "⛵ Naked Island", highlighted: false },
  { time: "12:30 PM", title: "🍽️ Lunch — Guyam", highlighted: true },
];

// The first two activities tick themselves off shortly after the card appears.
const TICK_TIMES_MS = [1500, 1920];

const OWE = 1780;
const TOTAL = 20900;

function Tick({ done }: { done: boolean }) {
  return (
    <motion.span
      animate={done ? { scale: [1, 1.25, 1] } : undefined}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`flex size-[22px] flex-none items-center justify-center rounded-full border-2 text-[11px] font-bold ${
        done
          ? "border-[rgba(52,211,153,.55)] bg-[rgba(52,211,153,.18)] text-[#34d399]"
          : "border-[#475569] text-transparent"
      }`}
    >
      ✓
    </motion.span>
  );
}

export function HeroMock() {
  const reduced = useReducedMotion();
  const [ticked, setTicked] = useState<boolean[]>(() => TICK_TIMES_MS.map(() => false));
  const owe = useCountUp(OWE, { delayMs: 1500, durationSec: 1.1 });
  const total = useCountUp(TOTAL, { delayMs: 1500, durationSec: 1.4 });

  useEffect(() => {
    const timers = TICK_TIMES_MS.map((ms, index) =>
      setTimeout(() => setTicked((prev) => prev.map((done, i) => done || i === index)), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className='relative min-w-0'>
      <motion.div
        initial={{ opacity: 0, y: 34, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
      >
        <motion.div
          animate={reduced ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 7, delay: 1.3, repeat: Infinity, ease: "easeInOut" }}
          className='relative overflow-hidden rounded-[26px] border border-white/[.09] bg-[linear-gradient(180deg,rgba(15,23,42,.92),rgba(2,6,23,.92))] shadow-[0_60px_120px_-50px_rgba(0,0,0,.9)]'
        >
          <div className='flex items-center justify-between border-b border-white/[.06] px-[18px] py-4'>
            <div className='min-w-0'>
              <p className='font-mono text-[10px] uppercase tracking-[.18em] text-[#64748b]'>Siargao · Day 2 of 5</p>
              <p className='mt-[3px] text-[17px] font-bold text-[#f8fafc]'>Island Hopping</p>
            </div>
            <div className='flex items-center'>
              {AVATARS.map((avatar) => (
                <div
                  key={avatar.label}
                  className={`flex size-[26px] items-center justify-center rounded-full border-2 border-[#0b1120] text-[10px] ${avatar.className}`}
                >
                  {avatar.label}
                </div>
              ))}
            </div>
          </div>

          <div className='flex flex-col gap-[10px] p-[14px]'>
            {ACTIVITIES.map((activity, index) => (
              <motion.div
                key={activity.time}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.6 + index * 0.11, ease: EASE }}
                className={`flex items-center gap-3 rounded-[14px] border bg-[rgba(30,41,59,.4)] px-[14px] py-[13px] ${
                  activity.highlighted ? "border-[rgba(249,115,22,.28)]" : "border-white/[.05]"
                }`}
              >
                <Tick done={ticked[index] ?? false} />
                <div className='flex flex-none items-center gap-[6px] rounded-md bg-[rgba(2,6,23,.6)] px-2 py-1 font-mono text-[11px] text-[#cbd5e1]'>
                  <Clock className='size-[11px]' />
                  {activity.time}
                </div>
                <p className='truncate text-sm font-semibold text-[#e2e8f0]'>{activity.title}</p>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.6 + ACTIVITIES.length * 0.11, ease: EASE }}
              className='mt-1 rounded-2xl border border-[rgba(245,158,11,.22)] bg-[rgba(245,158,11,.07)] p-[14px]'
            >
              <div className='mb-[10px] flex items-center justify-between gap-3'>
                <p className='font-mono text-[10px] uppercase tracking-[.16em] text-[#fcd34d]'>Running tab</p>
                <p className='text-[11px] text-[#94a3b8]'>split 5 ways</p>
              </div>
              <div className='flex items-end justify-between gap-4'>
                <div>
                  <p className='text-[11px] text-[#94a3b8]'>You owe MJ</p>
                  <p className='mt-[2px] text-[26px] font-extrabold tabular-nums text-[#fb923c]'>
                    ₱{owe.toLocaleString("en-US")}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-[11px] text-[#94a3b8]'>Trip total</p>
                  <p className='mt-[2px] text-[26px] font-extrabold tabular-nums text-[#fbbf24]'>
                    ₱{total.toLocaleString("en-US")}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -18, scale: 0.94 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 2.1, ease: [0.34, 1.56, 0.64, 1] }}
        className='absolute bottom-[34px] left-[-14px] flex items-center gap-[9px] rounded-[14px] border border-white/[.12] bg-[rgba(2,6,23,.95)] px-[14px] py-[10px] shadow-[0_20px_40px_-20px_rgba(0,0,0,1)]'
      >
        <Users className='size-[15px] text-[#34d399]' />
        <span className='text-xs text-[#cbd5e1]'>
          RC joined with code <strong className='font-mono text-[#fbbf24]'>7XK2QD</strong>
        </span>
      </motion.div>
    </div>
  );
}
