"use client";

import { Copy, Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/clipboard";
import type { Expense } from "@/src/shared/types";
import { PILL } from "../../shared/Pills";
import { METHOD_LABEL, type ShareBox } from "./expenseDetailView";

/** The amber box: your share (or what you paid) and, when it applies, the "I've paid my share" button. */
export function YourShareCard({ box, onMarkPaid }: { box: ShareBox; onMarkPaid?: () => void }) {
  return (
    <div className='flex flex-col gap-[10px] rounded-[22px] border border-[rgba(245,158,11,.22)] bg-[rgba(245,158,11,.07)] p-[18px]'>
      <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#fcd34d]'>{box.title}</span>
      <span className='text-[30px] font-extrabold tabular-nums text-[#fb923c]'>{box.amount}</span>
      <span className='text-[13px] leading-[1.5] text-[#cbd5e1]'>{box.note}</span>
      {box.canMark && onMarkPaid ? (
        <button
          type='button'
          onClick={onMarkPaid}
          className='mt-1 cursor-pointer rounded-xl bg-[linear-gradient(100deg,#fbbf24,#f97316)] p-[13px] text-[15px] font-extrabold text-[#160c02] shadow-[0_18px_40px_-18px_rgba(251,146,60,.9)]'
        >
          I&apos;ve paid my share
        </button>
      ) : null}
    </div>
  );
}

function QrModal({ src, filename, onClose }: { src: string; filename: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const download = async () => {
    try {
      const blob = await (await fetch(src)).blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
      toast.error("Couldn't download the QR code");
    }
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6' onClick={onClose} role='dialog' aria-modal>
      <div className='relative flex max-h-full w-full max-w-sm flex-col gap-4' onClick={(event) => event.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt='Payment QR code' className='max-h-[70vh] w-full rounded-2xl bg-white object-contain' />
        <div className='flex justify-center gap-2'>
          <button type='button' onClick={download} className={PILL.amber}>
            <Download className='size-[14px]' />
            Download
          </button>
          <button type='button' onClick={onClose} className={PILL.ghost}>
            <X className='size-[14px]' />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface PayWithCardProps {
  expense: Expense;
  payerShort: string;
}

/** How to pay the payer: method, account details (tap to copy) and their QR code. */
export function PayWithCard({ expense, payerShort }: PayWithCardProps) {
  const [showQr, setShowQr] = useState(false);
  const method = METHOD_LABEL[expense.paymentMethod ?? ""];
  if (!method) return null;

  const copy = async (text: string) => {
    if (await copyToClipboard(text)) toast.success("Copied");
    else toast.error("Couldn't copy that");
  };

  return (
    <div className='flex flex-col gap-3 rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[18px]'>
      <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>Pay {payerShort} with</span>
      <span className='text-lg font-bold'>{method}</span>
      {expense.accountName ? <span className='text-sm font-semibold text-[#e2e8f0]'>{expense.accountName}</span> : null}
      {expense.bankName || expense.accountNumber ? (
        <button
          type='button'
          disabled={!expense.accountNumber}
          onClick={() => expense.accountNumber && copy(expense.accountNumber)}
          className='flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/[.08] bg-[rgba(2,6,23,.6)] px-3 py-[10px] text-left disabled:cursor-default'
        >
          <span className='flex min-w-0 flex-col gap-[2px]'>
            <span className='font-mono text-[10px] uppercase tracking-[.12em] text-[#64748b]'>{expense.bankName || "Account number"}</span>
            <span className='truncate font-mono text-[13px] text-[#cbd5e1]'>{expense.accountNumber || "—"}</span>
          </span>
          {expense.accountNumber ? <Copy className='size-4 flex-none text-[#94a3b8]' /> : null}
        </button>
      ) : null}
      {expense.qrImage ? (
        <>
          <button
            type='button'
            onClick={() => setShowQr(true)}
            aria-label="Open the payer's QR code"
            className='relative aspect-square w-full max-w-[180px] cursor-zoom-in overflow-hidden rounded-[14px] border border-white/[.18] bg-white'
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={expense.qrImage} alt="Payer's QR code" className='size-full object-cover' />
          </button>
          {showQr ? (
            <QrModal
              src={expense.qrImage}
              filename={`payment-qr-${expense.description.replace(/\s+/g, "-").toLowerCase()}.png`}
              onClose={() => setShowQr(false)}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
