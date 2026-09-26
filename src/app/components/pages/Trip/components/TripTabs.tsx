import { cn } from "@/lib/utils";
import type { TabType } from "../tripTabs";

// The order and names on the tab row; "daily" and "schedule" are the ids the ?tab= link uses.
const TABS: { id: TabType; label: string }[] = [
  { id: "daily", label: "Day" },
  { id: "schedule", label: "Timeline" },
  { id: "calendar", label: "Calendar" },
  { id: "expenses", label: "Expenses" },
  { id: "budget", label: "Budget" },
];

interface TripTabsProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

/** A sticky, sideways-scrolling pill row at the top of the trip, in place of the old floating icon bar. */
export function TripTabs({ activeTab, onChange }: TripTabsProps) {
  return (
    <div className='sticky top-0 z-[4] -mx-1 bg-[rgba(2,6,23,.85)] px-1 py-2 backdrop-blur-[18px]'>
      <div
        role='tablist'
        className='box-border flex w-max max-w-full gap-1 overflow-x-auto rounded-full border border-white/[.08] bg-[rgba(15,23,42,.6)] p-1 [scrollbar-width:none]'
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type='button'
            role='tab'
            aria-selected={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-none cursor-pointer rounded-full px-4 py-[9px] text-sm font-semibold",
              activeTab === tab.id ? "bg-[#f8fafc] text-[#020617]" : "text-[#94a3b8] hover:text-[#f8fafc]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
