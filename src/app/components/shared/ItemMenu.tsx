"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ITEM = "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm hover:bg-white/[.05]";

interface ItemMenuProps {
  /** What is being edited, e.g. "expense" or "activity". */
  noun: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

/** Edit and delete for whoever is allowed to change an item. */
export function ItemMenu({ noun, onEdit, onDelete }: ItemMenuProps) {
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

  if (!onEdit && !onDelete) return null;

  return (
    <div ref={wrapper} className='relative flex-none'>
      <button
        type='button'
        aria-label={`${noun} actions`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className='flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/[.14] bg-white/[.03] text-[#e2e8f0] hover:bg-white/[.07]'
      >
        <MoreVertical className='size-[18px]' />
      </button>
      {open ? (
        <div role='menu' className='absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-[14px] border border-white/[.1] bg-[#020617] shadow-[0_30px_80px_-30px_rgba(0,0,0,1)]'>
          {onEdit ? (
            <button type='button' role='menuitem' onClick={() => { setOpen(false); onEdit(); }} className={`${ITEM} text-[#cbd5e1]`}>
              <Pencil className='size-4' />
              Edit {noun}
            </button>
          ) : null}
          {onDelete ? (
            <button type='button' role='menuitem' onClick={() => { setOpen(false); onDelete(); }} className={`${ITEM} border-t border-white/[.05] text-[#f87171]`}>
              <Trash2 className='size-4' />
              Delete {noun}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
