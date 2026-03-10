"use client";
import React from "react";
import LoadingState from "../LoadingState";

interface INavigationLoaderProps {
  message?: string;
}

const NavigationLoader = ({}: INavigationLoaderProps) => {
  return (
    <div className='fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in'>
      <div className='rounded-2xl border border-slate-800 bg-slate-900/90 px-8 py-6 shadow-2xl animate-fade-in-up'>
        <LoadingState />
      </div>
    </div>
  );
};

export default NavigationLoader;
