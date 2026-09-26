"use client";

import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Link2 } from "lucide-react";
import { StaggerGroup } from "../../shared/Site/Stagger";
import { EASE } from "../../shared/Site/motion";

const PANEL = "min-w-0 rounded-[20px] border border-white/[.08] bg-[rgba(15,23,42,.6)]";
const MONO_LABEL = "font-mono text-[10px] uppercase text-[#94a3b8]";

// Days 11–15 are the trip; the rest of the fortnight is dimmed.
const DAYS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const TRIP_DAYS = new Set([11, 12, 13, 14, 15]);

export function CalendarMock() {
  return (
    <div className={`${PANEL} p-[18px]`}>
      <div className='mb-[14px] flex items-center justify-between'>
        <p className='text-[15px] font-bold'>March 2026</p>
        <div className='flex gap-[6px] text-[#64748b]'>
          <ChevronLeft className='size-4' />
          <ChevronRight className='size-4' />
        </div>
      </div>
      <div className='mb-[6px] grid grid-cols-7 gap-[6px] text-center font-mono text-[10px] text-[#64748b]'>
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <span key={index}>{day}</span>
        ))}
      </div>
      <StaggerGroup gap={0.06} margin='0px' className='grid grid-cols-7 gap-[6px]'>
        {DAYS.map((day) =>
          TRIP_DAYS.has(day) ? (
            <motion.div
              key={day}
              variants={{
                hidden: { opacity: 0, scale: 0.82 },
                visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] } },
              }}
              className='flex aspect-square items-center justify-center rounded-lg border border-[rgba(245,158,11,.4)] bg-[rgba(245,158,11,.16)] text-xs font-bold text-[#fcd34d]'
            >
              {day}
            </motion.div>
          ) : (
            <div
              key={day}
              className='flex aspect-square items-center justify-center rounded-lg bg-[rgba(30,41,59,.35)] text-xs text-[#475569]'
            >
              {day}
            </div>
          ),
        )}
      </StaggerGroup>
      <div className='mt-[14px] flex items-center gap-[10px] rounded-xl border border-white/[.06] bg-[rgba(2,6,23,.6)] px-[14px] py-3'>
        <Calendar className='size-[15px] text-[#fbbf24]' />
        <span className='text-[13px] text-[#cbd5e1]'>5 days · 18 activities · 3 marked done</span>
      </div>
    </div>
  );
}

const EXPENSES = [
  { emoji: "🏨", title: "Hostel, 2 nights", meta: "MJ paid · split 5 ways", amount: "₱7,500", status: "settled", done: true },
  { emoji: "🚗", title: "Van + boat rental", meta: "RC paid · split 5 ways", amount: "₱6,000", status: "2 pending", done: false },
  { emoji: "🍽️", title: "Lunch at Guyam", meta: "You paid · split 5 ways", amount: "₱2,400", status: "3 pending", done: false },
];

export function TabMock() {
  return (
    <div className={`${PANEL} order-2 p-[18px]`}>
      <div className='mb-[14px] grid grid-cols-2 gap-[10px]'>
        <div className='rounded-[14px] border border-white/[.05] bg-[rgba(30,41,59,.4)] p-[14px]'>
          <p className={`mb-[6px] tracking-[.14em] ${MONO_LABEL}`}>My expenses</p>
          <p className='text-[22px] font-extrabold text-[#fb923c]'>₱4,180</p>
        </div>
        <div className='rounded-[14px] border border-white/[.05] bg-[rgba(30,41,59,.4)] p-[14px]'>
          <p className={`mb-[6px] tracking-[.14em] ${MONO_LABEL}`}>Trip total</p>
          <p className='text-[22px] font-extrabold text-[#fbbf24]'>₱20,900</p>
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        {EXPENSES.map((expense) => (
          <div
            key={expense.title}
            className='flex items-center gap-3 rounded-xl border border-white/[.05] bg-[rgba(30,41,59,.3)] px-[14px] py-3'
          >
            <span className='text-[17px]'>{expense.emoji}</span>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-semibold'>{expense.title}</p>
              <p className='mt-[2px] text-[11px] text-[#64748b]'>{expense.meta}</p>
            </div>
            <div className='text-right'>
              <p className='text-sm font-bold'>{expense.amount}</p>
              <p className={`mt-[2px] text-[10px] ${expense.done ? "text-[#34d399]" : "text-[#fbbf24]"}`}>
                {expense.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CODE = "7XK2QD".split("");

export function CodeMock() {
  return (
    <div className={`${PANEL} p-[clamp(22px,3vw,34px)] text-center`}>
      <p className={`mb-4 tracking-[.2em] ${MONO_LABEL}`}>Group code</p>
      <StaggerGroup
        gap={0.07}
        margin='0px'
        className='mb-5 flex justify-center gap-[clamp(6px,1.4vw,10px)] [perspective:600px]'
      >
        {CODE.map((char, index) => (
          <motion.span
            key={index}
            variants={{
              hidden: { opacity: 0, rotateX: -80 },
              visible: { opacity: 1, rotateX: 0, transition: { duration: 0.5, ease: EASE } },
            }}
            className='flex h-[clamp(48px,7.4vw,64px)] w-[clamp(38px,6vw,52px)] items-center justify-center rounded-xl border border-[rgba(251,191,36,.3)] bg-[rgba(2,6,23,.8)] font-mono text-[clamp(20px,3vw,26px)] font-semibold text-[#fbbf24]'
          >
            {char}
          </motion.span>
        ))}
      </StaggerGroup>
      <div className='flex items-center justify-center gap-2 text-[13px] text-[#94a3b8]'>
        <Link2 className='size-[14px] text-[#fbbf24]' />
        wanderly.app/invite/7XK2QD
      </div>
    </div>
  );
}
