import { Loader2, Upload } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/utils/money";
import { CHIP, CHIP_OFF, CHIP_ON, FIELD_ERROR, FIELD_LABEL, INPUT } from "../../formStyles";
import type { TExpenseSchema } from "../expenseSchema";

const METHODS: { value: "cash" | "bank" | "gcash" | "maya"; label: string; emoji: string }[] = [
  { value: "cash", label: "Cash", emoji: "💵" },
  { value: "bank", label: "Bank transfer", emoji: "🏦" },
  { value: "gcash", label: "GCash", emoji: "💰" },
  { value: "maya", label: "Maya", emoji: "💳" },
];

interface IPaymentStepProps {
  form: UseFormReturn<TExpenseSchema>;
  uploadingImage: boolean;
  uploadError: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowImageModal: (value: boolean) => void;
  /** Shown in the summary: who paid. */
  paidByName: string;
}

/** Step 3: how people can pay the payer back (all optional), and a summary of the whole expense. */
export const PaymentStep = ({ form, uploadingImage, uploadError, handleImageUpload, setShowImageModal, paidByName }: IPaymentStepProps) => {
  const method = form.watch("paymentMethod");
  const qr = form.watch("qrImage");
  const errors = form.formState.errors;
  const amount = Number(form.watch("amount")) || 0;

  return (
    <div className='flex flex-col gap-[18px]'>
      <p className='rounded-xl border border-[rgba(56,189,248,.2)] bg-[rgba(56,189,248,.06)] p-[14px] text-xs leading-[1.6] text-[#bae6fd]'>
        Payment details help people pay you back faster. Skip them if it was cash, or if you don&apos;t need to be paid back yet.
      </p>

      <div className='flex flex-col gap-[9px]'>
        <span className={FIELD_LABEL}>Payment method</span>
        <div className='grid grid-cols-2 gap-2'>
          {METHODS.map((item) => (
            <button
              key={item.value}
              type='button'
              aria-pressed={method === item.value}
              onClick={() => form.setValue("paymentMethod", item.value, { shouldValidate: true })}
              className={cn(CHIP, "justify-center rounded-xl py-3", method === item.value ? CHIP_ON : CHIP_OFF)}
            >
              <span>{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {method && method !== "cash" ? (
        <div className='flex flex-col gap-[14px]'>
          {method === "bank" ? (
            <label className='flex flex-col gap-[7px]'>
              <span className={FIELD_LABEL}>Bank</span>
              <input type='text' {...form.register("bankName")} placeholder='e.g. BDO, BPI' className={INPUT} />
            </label>
          ) : null}
          <label className='flex flex-col gap-[7px]'>
            <span className={FIELD_LABEL}>Account name</span>
            <input type='text' {...form.register("accountName")} placeholder='Name on the account' className={INPUT} />
          </label>
          <label className='flex flex-col gap-[7px]'>
            <span className={FIELD_LABEL}>Account number</span>
            <input type='text' {...form.register("accountNumber")} placeholder='Number to pay to' className={INPUT} />
            {errors.accountNumber ? <span className={FIELD_ERROR}>{errors.accountNumber.message}</span> : null}
          </label>

          <div className='flex flex-col gap-[7px]'>
            <span className={FIELD_LABEL}>QR code (optional)</span>
            {!qr ? (
              <label
                className={cn(
                  "flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/[.14] text-[#94a3b8] hover:border-[rgba(251,191,36,.45)] hover:text-[#fbbf24]",
                  uploadingImage && "pointer-events-none opacity-50",
                )}
              >
                {uploadingImage ? <Loader2 className='size-7 animate-spin' /> : <Upload className='size-7' />}
                <span className='text-sm'>{uploadingImage ? "Uploading…" : "Tap to upload your QR"}</span>
                <input type='file' className='hidden' accept='image/*' onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            ) : (
              <div className='flex items-center gap-3 rounded-xl border border-white/[.1] bg-[rgba(2,6,23,.6)] p-3'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt='QR preview' className='size-20 rounded-lg bg-white object-contain' />
                <span className='flex gap-2'>
                  <button type='button' onClick={() => setShowImageModal(true)} className='cursor-pointer rounded-full border border-white/[.14] px-3 py-[6px] text-xs font-semibold text-[#e2e8f0]'>
                    View
                  </button>
                  <button type='button' onClick={() => form.setValue("qrImage", "")} className='cursor-pointer rounded-full border border-[rgba(248,113,113,.3)] px-3 py-[6px] text-xs font-semibold text-[#f87171]'>
                    Remove
                  </button>
                </span>
              </div>
            )}
            {uploadError ? <span className={FIELD_ERROR}>{uploadError}</span> : null}
          </div>
        </div>
      ) : null}

      <div className='rounded-2xl border border-[rgba(245,158,11,.22)] bg-[rgba(245,158,11,.07)] p-4'>
        <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#fcd34d]'>Summary</span>
        <p className='mt-1 text-sm text-[#e2e8f0]'>
          {formatPeso(amount)} · {form.watch("description") || "Untitled"} · paid by {paidByName}
        </p>
      </div>
    </div>
  );
};
