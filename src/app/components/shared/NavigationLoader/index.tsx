"use client";
import React from "react";

interface INavigationLoaderProps {
  message?: string;
}

const NavigationLoader = ({
  message = "Loading...",
}: INavigationLoaderProps) => {
  return (
    <div className='fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in'>
      <div className='glass-card rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 animate-fade-in-up max-w-[280px] w-full'>
        <div className='relative'>
          <div className='w-16 h-16 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin'></div>
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='w-2 h-2 bg-orange-500 rounded-full animate-pulse'></div>
          </div>
        </div>
        <p className='text-slate-300 font-bold tracking-tight text-center'>
          {message}
        </p>
      </div>
    </div>
  );
};

export default NavigationLoader;
