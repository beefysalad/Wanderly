"use client";
import React from "react";

interface INavigationLoaderProps {
  message?: string;
}

const NavigationLoader = ({ message = "Loading..." }: INavigationLoaderProps) => {
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200'>
      <div className='bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 animate-in zoom-in-95 ease-out duration-200'>
        <div className='w-16 h-16 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin'></div>
        <p className='text-slate-600 font-medium'>{message}</p>
      </div>
    </div>
  );
};

export default NavigationLoader;



