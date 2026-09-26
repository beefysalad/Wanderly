"use client";

import { LogOut, MoreVertical, Settings, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface GroupMenuProps {
  isOwner: boolean;
  onSettings: () => void;
  onDelete: () => void;
  onLeave: () => void;
}

const ITEM = "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm hover:bg-white/[.05]";

/** The three-dots menu on a group: settings and delete for the owner, leave for everyone else. */
export function GroupMenu({ isOwner, onSettings, onDelete, onLeave }: GroupMenuProps) {
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
        aria-label='Group actions'
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className='flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/[.14] bg-white/[.03] text-[#e2e8f0] hover:bg-white/[.07]'
      >
        <MoreVertical className='size-[18px]' />
      </button>
      {open ? (
        <div
          role='menu'
          className='absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-[14px] border border-white/[.1] bg-[#020617] shadow-[0_30px_80px_-30px_rgba(0,0,0,1)]'
        >
          {isOwner ? (
            <button type='button' role='menuitem' onClick={choose(onSettings)} className={`${ITEM} text-[#cbd5e1]`}>
              <Settings className='size-4' />
              Group settings
            </button>
          ) : null}
          {isOwner ? (
            <button type='button' role='menuitem' onClick={choose(onDelete)} className={`${ITEM} border-t border-white/[.05] text-[#f87171]`}>
              <Trash2 className='size-4' />
              Delete group
            </button>
          ) : (
            <button type='button' role='menuitem' onClick={choose(onLeave)} className={`${ITEM} text-[#f87171]`}>
              <LogOut className='size-4' />
              Leave group
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
