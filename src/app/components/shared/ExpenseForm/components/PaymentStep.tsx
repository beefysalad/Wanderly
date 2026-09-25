import { HelpCircle, Upload, Loader2, Building, User, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { UseFormReturn } from "react-hook-form";
import type { TExpenseSchema } from "../expenseSchema";

interface IPaymentStepProps {
  form: UseFormReturn<TExpenseSchema>;
  uploadingImage: boolean;
  uploadError: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowImageModal: (value: boolean) => void;
}

export const PaymentStep = ({
  form,
  uploadingImage,
  uploadError,
  handleImageUpload,
  setShowImageModal,
}: IPaymentStepProps) => {
  return (
    <div className='space-y-6'>
      <div className='text-center mb-2 hidden sm:block'>
        <h3 className='text-lg font-bold text-white'>
          Payment Details
        </h3>
        <p className='text-sm text-slate-400'>
          Optional details for reimbursement.
        </p>
      </div>

      <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3'>
        <HelpCircle className='w-5 h-5 text-blue-400 flex-shrink-0' />
        <p className='text-xs text-blue-200 leading-relaxed'>
          Adding payment details helps others pay you back faster.
          You can skip this if you recorded a cash payment or
          don&apos;t need reimbursement yet.
        </p>
      </div>

      <div>
        <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
          Payment Method
        </label>
        <div className='grid grid-cols-2 gap-3'>
          {["cash", "bank", "maya", "gcash"].map((method) => {
            const isSelected =
              form.watch("paymentMethod") === method;
            return (
              <button
                key={method}
                type='button'
                onClick={() => {
                  form.setValue(
                    "paymentMethod",
                    method as "cash" | "bank" | "maya" | "gcash",
                  );
                  // Reset other fields if needed, or keep them
                }}
                className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isSelected
                    ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                    : "bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {method === "cash" && "💵"}
                {method === "bank" && "🏦"}
                {method === "maya" && "💳"}
                {method === "gcash" && "💰"}
                <span className='capitalize'>{method}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conditional Logic for Payment Details */}
      <AnimatePresence>
        {form.watch("paymentMethod") &&
          form.watch("paymentMethod") !== "cash" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className='space-y-4 pt-2'
            >
              {form.watch("paymentMethod") === "bank" && (
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <Building className='w-4 h-4 text-slate-500' />
                  </div>
                  <input
                    type='text'
                    {...form.register("bankName")}
                    placeholder='Bank Name (e.g. BDO, BPI)'
                    className='w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm'
                  />
                </div>
              )}

              <div className='space-y-4'>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <User className='w-4 h-4 text-slate-500' />
                  </div>
                  <input
                    type='text'
                    {...form.register("accountName")}
                    placeholder='Account Name'
                    className='w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm'
                  />
                </div>

                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <Hash className='w-4 h-4 text-slate-500' />
                  </div>
                  <input
                    type='text'
                    {...form.register("accountNumber")}
                    placeholder='Account Number'
                    className='w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm'
                  />
                </div>

                {/* QR Upload */}
                <div>
                  <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
                    QR Code (Optional)
                  </label>

                  {!form.watch("qrImage") ? (
                    <label
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-all group ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                        {uploadingImage ? (
                          <Loader2 className='w-8 h-8 text-orange-500 animate-spin mb-2' />
                        ) : (
                          <Upload className='w-8 h-8 text-slate-500 group-hover:text-orange-500 mb-2 transition-colors' />
                        )}
                        <p className='text-sm text-slate-500 group-hover:text-slate-300'>
                          {uploadingImage
                            ? "Uploading..."
                            : "Click to upload QR Image"}
                        </p>
                      </div>
                      <input
                        type='file'
                        className='hidden'
                        accept='image/*'
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  ) : (
                    <div className='relative w-full h-48 bg-slate-950 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden group'>
                      <Image
                        src={form.watch("qrImage") || ""}
                        alt='QR Preview'
                        fill
                        className='object-contain p-2'
                      />
                      <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                        <button
                          type='button'
                          onClick={() => setShowImageModal(true)}
                          className='p-2 bg-slate-700 rounded-lg hover:bg-slate-600 text-white transition-colors'
                        >
                          View
                        </button>
                        <button
                          type='button'
                          onClick={() =>
                            form.setValue("qrImage", "")
                          }
                          className='p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors'
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                  {uploadError && (
                    <p className='text-xs text-red-500 mt-2'>
                      {uploadError}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};
