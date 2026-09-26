"use client";

import { Calendar, Download, ImageIcon, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PILL } from "../../../shared/Pills";

interface TripExportMenuProps {
  isExporting: boolean;
  onExport: (format: "png" | "ics") => void;
  /** Deleting a trip is only offered to the person who created it. */
  isTripCreator: boolean;
  onDelete: () => void;
}

const ITEM = "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm text-[#cbd5e1] hover:bg-white/[.05] disabled:cursor-not-allowed disabled:opacity-60";

/** "Export" pill: save the itinerary as an image or calendar file, and (for the creator) delete the trip. */
export function TripExportMenu({ isExporting, onExport, isTripCreator, onDelete }: TripExportMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div ref={wrapper} className='relative'>
      <button
        type='button'
        aria-expanded={open}
        aria-haspopup='true'
        onClick={() => setOpen((value) => !value)}
        className={cn(PILL.ghost, "gap-[7px] px-[14px] py-[9px] text-[13px]")}
      >
        {isExporting ? (
          <span className='size-[15px] animate-spin rounded-full border-2 border-[#64748b] border-t-white' />
        ) : (
          <Download className='size-[15px]' />
        )}
        Export
      </button>
      {open ? (
        <div
          role='menu'
          className='absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-[14px] border border-white/[.1] bg-[#020617] shadow-[0_30px_80px_-30px_rgba(0,0,0,1)]'
        >
          <p className='border-b border-white/[.05] bg-[rgba(251,191,36,.06)] px-4 py-2 font-mono text-[10px] uppercase tracking-[.12em] text-[#fcd34d]'>
            Export is in beta
          </p>
          <button type='button' role='menuitem' disabled={isExporting} onClick={choose(() => onExport("png"))} className={ITEM}>
            <ImageIcon className='size-4' />
            Itinerary as image (PNG)
          </button>
          <button
            type='button'
            role='menuitem'
            disabled={isExporting}
            onClick={choose(() => onExport("ics"))}
            className={cn(ITEM, "border-t border-white/[.05]")}
          >
            <Calendar className='size-4' />
            Calendar file (.ics)
          </button>
          {isTripCreator ? (
            <button
              type='button'
              role='menuitem'
              onClick={choose(onDelete)}
              className={cn(ITEM, "border-t border-white/[.05] text-[#f87171]")}
            >
              <Trash2 className='size-4' />
              Delete trip
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
