import { Expense } from "@/src/shared/types";
import React from "react";
import { useForm } from "react-hook-form";
import { expenseSchema, TExpenseSchema } from "./addExpenseZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { HelpCircle, Upload, X } from "lucide-react";
import Image from "next/image";

interface IAddExpenseModalProps {
  members: string[];
  onAddExpense: (expense: Omit<Expense, "id" | "groupId">) => void;
  onClose: () => void;
  editingExpense?: Expense;
}
const AddExpenseModal = ({
  members,
  onAddExpense,
  onClose,
  editingExpense,
}: IAddExpenseModalProps) => {
  const form = useForm<TExpenseSchema>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      accountName: "",
      accountNumber: "",
      amount: "",
      bankName: "",
      category: "",
      date: "",
      description: "",
      paidBy: "",
      paymentMethod: "",
      qrImage: "",
      splitWith: [],
    },
  });
  const onSubmit = (values: TExpenseSchema) => console.log(values);

  const toggleMember = (member: string) => {
    // setSplitWith((prev) => (prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]))
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // const file = e.target.files?.[0]
    // if (file) {
    //   const reader = new FileReader()
    //   reader.onloadend = () => {
    //     setQrImage(reader.result as string)
    //   }
    //   reader.readAsDataURL(file)
    // }
  };
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-slate-800 rounded-lg max-w-md w-full max-h-screen overflow-y-auto'>
        <div className='flex items-center justify-between p-4 border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800'>
          <h2 className='text-lg font-semibold text-slate-900 dark:text-white'>
            {editingExpense ? "Edit Expense" : "Add Expense"}
          </h2>
          <button
            onClick={onClose}
            className='p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className='p-4 space-y-4'>
          {/* Date */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'>
              Date
            </label>
            <input
              type='date'
              {...form.register("date")}
              className='w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
            />
          </div>

          {/* Paid By */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'>
              Paid By *
            </label>
            <select
              {...form.register("paidBy")}
              className='w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
            >
              {members.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'>
              Amount (PHP) *
            </label>
            <input
              type='number'
              step='0.01'
              {...form.register("amount")}
              placeholder='0.00'
              className='w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400'
            />
          </div>

          {/* Description */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'>
              Description *
            </label>
            <input
              type='text'
              {...form.register("description")}
              placeholder='e.g., Hotel booking, Restaurant'
              className='w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400'
            />
          </div>

          {/* Category */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'>
              Category
            </label>
            <select
              {...form.register("category")}
              className='w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
            >
              <option value='accommodation'>🏨 Accommodation</option>
              <option value='food'>🍽️ Food & Dining</option>
              <option value='transport'>🚗 Transport</option>
              <option value='activities'>🎯 Activities</option>
              <option value='other'>📌 Other</option>
            </select>
          </div>

          {/* Split With */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
              Split Among (who should pay back?)
            </label>
            <div className='space-y-2'>
              {members.map((member) => (
                <label
                  key={member}
                  className='flex items-center gap-2 cursor-pointer'
                >
                  <input
                    type='checkbox'
                    {...form.register("splitWith")}
                    onChange={() => toggleMember(member)}
                    className='w-4 h-4 rounded border-slate-300 text-emerald-600'
                  />
                  <span className='text-sm text-slate-700 dark:text-slate-300'>
                    {member}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Method Section */}
          <div className='pt-4 border-t border-slate-200 dark:border-slate-700'>
            <div className='flex items-center gap-2 mb-2'>
              <label className='block text-sm font-medium text-slate-700 dark:text-slate-300'>
                Preferred Payment Method
              </label>
              <div className='group relative'>
                <HelpCircle className='w-4 h-4 text-slate-400 cursor-help' />
                <div className='absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-xs rounded shadow-lg z-10'>
                  Add your payment details so others know how to pay you back
                </div>
              </div>
            </div>
            <select
              {...form.register("paymentMethod", {
                onChange: (e) => {
                  const value = e.target.value as
                    | "bank"
                    | "maya"
                    | "gcash"
                    | "cash"
                    | "";

                  // Update RHF value
                  form.setValue("paymentMethod", value);

                  // Also clear dependent fields
                  form.setValue("accountNumber", "");
                  form.setValue("bankName", "");
                  form.setValue("accountName", "");
                  form.setValue("qrImage", "");
                },
              })}
              className='w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white mb-3'
            >
              <option value=''>Select payment method</option>
              <option value='bank'>🏦 Bank Transfer</option>
              <option value='maya'>💳 Maya</option>
              <option value='gcash'>💰 GCash</option>
            </select>

            {form.watch("paymentMethod") && (
              <div className='space-y-3'>
                {form.watch("paymentMethod") === "bank" && (
                  <div>
                    <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'>
                      Bank Name *
                    </label>
                    <input
                      type='text'
                      {...form.register("bankName")}
                      placeholder='e.g., BDO, BPI, Metrobank'
                      className='w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400'
                    />
                  </div>
                )}

                <div>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'>
                    Account Name{" "}
                    {form.watch("paymentMethod") === "bank"
                      ? "*"
                      : "(Optional)"}
                  </label>
                  <input
                    type='text'
                    {...form.register("accountName")}
                    placeholder='Full name on account'
                    className='w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400'
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'>
                    Account Number
                  </label>
                  <input
                    type='text'
                    {...form.register("accountNumber")}
                    placeholder={`Enter account number`}
                    className='w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400'
                  />
                </div>

                {/* QR Code Upload */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'>
                    QR Code (Optional)
                  </label>
                  <div className='flex items-center gap-2'>
                    <label className='flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors'>
                      <Upload className='w-4 h-4' />
                      <span className='text-sm'>
                        {form.watch("qrImage") ? "Change QR" : "Upload QR"}
                      </span>
                      <input
                        type='file'
                        accept='image/*'
                        onChange={handleImageUpload}
                        className='hidden'
                      />
                    </label>
                  </div>
                  {form.watch("qrImage") && (
                    <div className='mt-2 relative'>
                      <Image
                        src={form.watch("qrImage") || "/placeholder.svg"}
                        alt='QR Code'
                        className='w-32 h-32 object-contain rounded border'
                      />
                      <button
                        type='button'
                        onClick={() => form.setValue("qrImage", "")}
                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type='submit'
            className='w-full mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors'
          >
            {editingExpense ? "Update Expense" : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
