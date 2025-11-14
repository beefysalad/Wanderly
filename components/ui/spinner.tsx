"use client";
import React from "react";
import { cn } from "@/lib/utils";

type SpinnerProps = {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
};

const sizeToClasses: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
  xl: "h-12 w-12 border-4",
};

export function Spinner({ size = "xl", label, className }: SpinnerProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-3", className)}
      role='status'
      aria-live='polite'
      aria-busy='true'
    >
      <div
        className={cn(
          "rounded-full animate-spin border-muted-foreground/30 border-t-foreground",
          sizeToClasses[size]
        )}
      />
      {label ? (
        <span className='text-sm text-muted-foreground'>{label}</span>
      ) : null}
    </div>
  );
}

export default Spinner;
