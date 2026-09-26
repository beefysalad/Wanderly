import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StepHeader } from "./StepHeader";

const AVATARS = [
  { label: "MJ", className: "bg-[#f59e0b] text-[#160c02] font-bold" },
  { label: "RC", className: "-ml-2 bg-[#38bdf8] text-[#06202e] font-bold" },
  { label: "TP", className: "-ml-2 bg-[#a78bfa] text-[#1c0f33] font-bold" },
  { label: "+2", className: "-ml-2 bg-[#1e293b] text-[#94a3b8] font-semibold" },
];

const ACTIVITIES = [
  { time: "6:30 AM", title: "🚐 Pickup at hostel", done: true },
  { time: "9:00 AM", title: "⛵ Naked Island", done: false },
];

function TourCard({ preview, title, body }: { preview: ReactNode; title: string; body: string }) {
  return (
    <div className='flex flex-col gap-[18px] rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[18px]'>
      {preview}
      <div>
        <h3 className='mb-[6px] text-lg font-bold'>{title}</h3>
        <p className='text-sm leading-[1.6] text-[#94a3b8]'>{body}</p>
      </div>
    </div>
  );
}

/** Three small pictures of what the app does; the numbers and names are sample content. */
export function TutorialStep() {
  return (
    <div className='mx-auto flex w-full max-w-[1040px] flex-col gap-7'>
      <StepHeader eyebrow='The short tour' title="Here's what you can do." />
      <div className='grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-[14px]'>
        <TourCard
          title='Squad goals'
          body='Create groups and invite your friends instantly.'
          preview={
            <div className='flex flex-col gap-3 rounded-[14px] border border-white/[.05] bg-[rgba(2,6,23,.6)] p-[14px]'>
              <div className='flex items-center'>
                {AVATARS.map((avatar) => (
                  <span
                    key={avatar.label}
                    className={cn(
                      "flex size-[26px] items-center justify-center rounded-full border-2 border-[#0b1120] text-[10px]",
                      avatar.className,
                    )}
                  >
                    {avatar.label}
                  </span>
                ))}
              </div>
              <span className='text-xs text-[#cbd5e1]'>
                RC joined with code <strong className='font-mono text-[#fbbf24]'>7XK2QD</strong>
              </span>
            </div>
          }
        />

        <TourCard
          title='Perfect plan'
          body='Build detailed itineraries with ease.'
          preview={
            <div className='flex flex-col gap-2 rounded-[14px] border border-white/[.05] bg-[rgba(2,6,23,.6)] p-[10px]'>
              {ACTIVITIES.map((activity) => (
                <div key={activity.time} className='flex items-center gap-[10px] rounded-[10px] bg-[rgba(30,41,59,.4)] px-[10px] py-[9px]'>
                  <span
                    className={cn(
                      "flex size-[18px] flex-none items-center justify-center rounded-full border-2 text-[9px] font-bold",
                      activity.done
                        ? "border-[rgba(52,211,153,.55)] bg-[rgba(52,211,153,.18)] text-[#34d399]"
                        : "border-[#475569] text-transparent",
                    )}
                  >
                    ✓
                  </span>
                  <span className='flex-none rounded-md bg-[rgba(2,6,23,.6)] px-[6px] py-[3px] font-mono text-[10px] text-[#cbd5e1]'>
                    {activity.time}
                  </span>
                  <span className='truncate text-xs font-semibold text-[#e2e8f0]'>{activity.title}</span>
                </div>
              ))}
            </div>
          }
        />

        <TourCard
          title='Split costs'
          body='Track expenses and settle up without the math.'
          preview={
            <div className='flex items-end justify-between gap-[10px] rounded-[14px] border border-[rgba(245,158,11,.22)] bg-[rgba(245,158,11,.07)] p-[14px]'>
              <div>
                <p className='text-[11px] text-[#94a3b8]'>You owe MJ</p>
                <p className='mt-[2px] text-[22px] font-extrabold tabular-nums text-[#fb923c]'>₱1,780</p>
              </div>
              <span className='font-mono text-[10px] uppercase tracking-[.14em] text-[#fcd34d]'>split 5 ways</span>
            </div>
          }
        />
      </div>
    </div>
  );
}
