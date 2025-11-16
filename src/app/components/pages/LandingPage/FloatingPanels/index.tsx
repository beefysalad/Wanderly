import { MapPin, Users, Zap, Calendar } from "lucide-react";
import React from "react";

const FloatingPanels = () => {
  return (
    <div className='hidden md:block'>
      <div className='space-y-4'>
        <div
          className='group bg-linear-to-br from-purple-900/40 to-violet-900/40 border border-amber-500/30 rounded-lg p-6 backdrop-blur-sm animate-fade-in-up hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 hover:-translate-y-2 cursor-pointer'
          style={{ animationDelay: "0.5s" }}
        >
          <div className='flex gap-4'>
            <div className='w-12 h-12 bg-linear-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-amber-500/50'>
              <MapPin className='w-6 h-6 text-purple-950 group-hover:animate-icon-bounce' />
            </div>
            <div>
              <h3 className='font-semibold mb-1 group-hover:text-amber-300 transition-colors'>Smart Planning</h3>
              <p className='text-sm text-slate-400 group-hover:text-slate-300 transition-colors'>
                Drag, drop, and organize activities seamlessly
              </p>
            </div>
          </div>
        </div>

        <div
          className='group bg-linear-to-br from-violet-900/40 to-purple-900/40 border border-orange-500/30 rounded-lg p-6 backdrop-blur-sm ml-4 animate-fade-in-up hover:border-orange-500/60 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-2 cursor-pointer'
          style={{ animationDelay: "0.7s" }}
        >
          <div className='flex gap-4'>
            <div className='w-12 h-12 bg-linear-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-orange-500/50'>
              <Users className='w-6 h-6 text-purple-950 group-hover:animate-icon-bounce' />
            </div>
            <div>
              <h3 className='font-semibold mb-1 group-hover:text-orange-300 transition-colors'>Group Sync</h3>
              <p className='text-sm text-slate-400 group-hover:text-slate-300 transition-colors'>
                See who&apos;s joining and stay in sync
              </p>
            </div>
          </div>
        </div>

        <div
          className='group bg-linear-to-br from-purple-900/40 to-indigo-900/40 border border-amber-500/30 rounded-lg p-6 backdrop-blur-sm animate-fade-in-up hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 hover:-translate-y-2 cursor-pointer'
          style={{ animationDelay: "0.9s" }}
        >
          <div className='flex gap-4'>
            <div className='w-12 h-12 bg-linear-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-amber-500/50'>
              <Zap className='w-6 h-6 text-purple-950 group-hover:animate-icon-bounce' />
            </div>
            <div>
              <h3 className='font-semibold mb-1 group-hover:text-amber-300 transition-colors'>Time Tracking</h3>
              <p className='text-sm text-slate-400 group-hover:text-slate-300 transition-colors'>
                Add time ranges to every activity
              </p>
            </div>
          </div>
        </div>

        <div
          className='group bg-linear-to-br from-indigo-900/40 to-purple-900/40 border border-orange-500/30 rounded-lg p-6 backdrop-blur-sm ml-4 animate-fade-in-up hover:border-orange-500/60 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-2 cursor-pointer'
          style={{ animationDelay: "1.1s" }}
        >
          <div className='flex gap-4'>
            <div className='w-12 h-12 bg-linear-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-orange-500/50'>
              <Calendar className='w-6 h-6 text-purple-950 group-hover:animate-icon-bounce' />
            </div>
            <div>
              <h3 className='font-semibold mb-1 group-hover:text-orange-300 transition-colors'>Calendar Integration</h3>
              <p className='text-sm text-slate-400 group-hover:text-slate-300 transition-colors'>
                Export schedules to Google, Apple, or Outlook calendars
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingPanels;
