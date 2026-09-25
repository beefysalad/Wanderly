import { Calendar, DollarSign, Layout, List, PieChart } from "lucide-react";
import type { TabType } from "../tripTabs";

interface ITabSwitcherProps {
  activeTab: TabType;
  handleTabChange: (tab: TabType) => void;
}

export const TabSwitcher = ({ activeTab, handleTabChange }: ITabSwitcherProps) => {
  return (
    <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50'>
      <div className='flex bg-slate-900 p-1.5 rounded-full border border-white/10 shadow-xl'>
        <button
          onClick={() => handleTabChange("daily")}
          className={`group relative p-3 rounded-full transition-all duration-300 ${
            activeTab === "daily"
              ? "bg-white text-slate-900"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layout className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
          <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
            Day Overview
          </span>
        </button>
        <button
          onClick={() => handleTabChange("schedule")}
          className={`group relative p-3 rounded-full transition-all duration-300 ${
            activeTab === "schedule"
              ? "bg-white text-slate-900"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <List className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
          <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
            Timeline
          </span>
        </button>
        <button
          onClick={() => handleTabChange("calendar")}
          className={`group relative p-3 rounded-full transition-all duration-300 ${
            activeTab === "calendar"
              ? "bg-white text-slate-900"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Calendar className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
          <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
            Calendar
          </span>
        </button>
        <button
          onClick={() => handleTabChange("expenses")}
          className={`group relative p-3 rounded-full transition-all duration-300 ${
            activeTab === "expenses"
              ? "bg-white text-slate-900"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <DollarSign className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
          <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
            Expenses
          </span>
        </button>
        <button
          onClick={() => handleTabChange("budget")}
          className={`group relative p-3 rounded-full transition-all duration-300 ${
            activeTab === "budget"
              ? "bg-white text-slate-900"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <PieChart className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
          <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
            Budget
          </span>
        </button>
      </div>
    </div>
  );
};
