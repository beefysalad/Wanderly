import { MapPin, Users, Zap, Calendar } from "lucide-react";
import React from "react";

const FloatingPanels = () => {
  return (
    <div className='hidden md:block'>
      <div className='space-y-4'>
        <div
          className='bg-linear-to-br from-purple-900/40 to-violet-900/40 border border-amber-500/30 rounded-lg p-6 backdrop-blur-sm animate-float'
          style={{ animationDelay: "0s" }}
        >
          <div className='flex gap-4'>
            <div className='w-12 h-12 bg-linear-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shrink-0'>
              <MapPin className='w-6 h-6 text-purple-950' />
            </div>
            <div>
              <h3 className='font-semibold mb-1'>Smart Planning</h3>
              <p className='text-sm text-slate-400'>
                Drag, drop, and organize activities seamlessly
              </p>
            </div>
          </div>
        </div>

        <div
          className='bg-linear-to-br from-violet-900/40 to-purple-900/40 border border-orange-500/30 rounded-lg p-6 backdrop-blur-sm ml-4 animate-float'
          style={{ animationDelay: "0.5s" }}
        >
          <div className='flex gap-4'>
            <div className='w-12 h-12 bg-linear-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center shrink-0'>
              <Users className='w-6 h-6 text-purple-950' />
            </div>
            <div>
              <h3 className='font-semibold mb-1'>Group Sync</h3>
              <p className='text-sm text-slate-400'>
                See who&apos;s joining and stay in sync
              </p>
            </div>
          </div>
        </div>

        <div
          className='bg-linear-to-br from-purple-900/40 to-indigo-900/40 border border-amber-500/30 rounded-lg p-6 backdrop-blur-sm animate-float'
          style={{ animationDelay: "1s" }}
        >
          <div className='flex gap-4'>
            <div className='w-12 h-12 bg-linear-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shrink-0'>
              <Zap className='w-6 h-6 text-purple-950' />
            </div>
            <div>
              <h3 className='font-semibold mb-1'>Time Tracking</h3>
              <p className='text-sm text-slate-400'>
                Add time ranges to every activity
              </p>
            </div>
          </div>
        </div>

        <div
          className='bg-linear-to-br from-indigo-900/40 to-purple-900/40 border border-orange-500/30 rounded-lg p-6 backdrop-blur-sm ml-4 animate-float'
          style={{ animationDelay: "1.5s" }}
        >
          <div className='flex gap-4'>
            <div className='w-12 h-12 bg-linear-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center shrink-0'>
              <Calendar className='w-6 h-6 text-purple-950' />
            </div>
            <div>
              <h3 className='font-semibold mb-1'>Calendar Integration</h3>
              <p className='text-sm text-slate-400'>
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
