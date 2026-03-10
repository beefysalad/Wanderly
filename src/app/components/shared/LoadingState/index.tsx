"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  fullScreen?: boolean;
  className?: string;
}

const LoadingState = ({ fullScreen = false, className }: LoadingStateProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen ? "min-h-screen" : "w-full",
        className
      )}
    >
      <div className='flex flex-col items-center gap-3'>
        <div className='h-8 w-8 rounded-full border-2 border-slate-700 border-t-amber-400 animate-spin' />
        <p className='text-sm text-slate-400'>Loading</p>
      </div>
    </div>
  );
};

export default LoadingState;
