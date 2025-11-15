import { Expense } from "@/src/shared/types";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { expenseSchema, TExpenseSchema } from "./addExpenseZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { HelpCircle, Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useCreateExpense, useUpdateExpense } from "@/src/hooks/useExpenses";
import api from "@/lib/axios";

interface IAddExpenseModalProps {
  tripId: string;
  groupId: string;
  members: string[];
  memberNames?: Record<string, string>; // email -> name mapping
  onAddExpense: () => void;
  onClose: () => void;
  editingExpense?: Expense;
}
const AddExpenseModal = ({
  tripId,
  groupId,
  members,
  memberNames,
  onAddExpense,
  onClose,
  editingExpense,
}: IAddExpenseModalProps) => {
  // Helper function to get display name from email
  const getDisplayName = (email: string): string => {
    return memberNames?.[email] || email.split("@")[0];
  };
  const [mounted, setMounted] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const createExpenseMutation = useCreateExpense(tripId, groupId);
  const updateExpenseMutation = useUpdateExpense(
    tripId,
    editingExpense?.id || "",
    groupId
  );

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

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
      paidBy: members[0] || "",
      paymentMethod: "",
      qrImage: "",
      splitWith: [],
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (editingExpense) {
      form.reset({
        accountName: editingExpense.accountName || "",
        accountNumber: editingExpense.accountNumber || "",
        amount: editingExpense.amount.toString(),
        bankName: editingExpense.bankName || "",
        category: editingExpense.category || "",
        date: new Date(editingExpense.date).toISOString().split("T")[0],
        description: editingExpense.description,
        paidBy: editingExpense.paidBy,
        paymentMethod: editingExpense.paymentMethod || "",
        qrImage: editingExpense.qrImage || "",
        splitWith: editingExpense.splitWith || [],
      });
    }
  }, [editingExpense, form]);

  const onSubmit = async (values: TExpenseSchema) => {
    try {
      if (editingExpense) {
        await updateExpenseMutation.mutateAsync({
          paidBy: values.paidBy,
          amount: Number(values.amount),
          description: values.description,
          date: new Date(values.date).toISOString(),
          category: values.category || undefined,
          paymentMethod:
            values.paymentMethod === "" || !values.paymentMethod
              ? undefined
              : (values.paymentMethod as "cash" | "bank" | "maya" | "gcash"),
          accountNumber: values.accountNumber || undefined,
          bankName: values.bankName || undefined,
          accountName: values.accountName || undefined,
          qrImage: values.qrImage || undefined,
          splitWith: values.splitWith,
        });
      } else {
        await createExpenseMutation.mutateAsync({
          paidBy: values.paidBy,
          amount: Number(values.amount),
          description: values.description,
          date: new Date(values.date).toISOString(),
          category: values.category || undefined,
          paymentMethod:
            values.paymentMethod === "" || !values.paymentMethod
              ? undefined
              : (values.paymentMethod as "cash" | "bank" | "maya" | "gcash"),
          accountNumber: values.accountNumber || undefined,
          bankName: values.bankName || undefined,
          accountName: values.accountName || undefined,
          qrImage: values.qrImage || undefined,
          splitWith: values.splitWith,
        });
      }
      onAddExpense();
    } catch (error) {
      console.error("Failed to save expense:", error);
    }
  };

  const toggleMember = (member: string) => {
    const currentSplitWith = form.getValues("splitWith");
    const newSplitWith = currentSplitWith.includes(member)
      ? currentSplitWith.filter((m) => m !== member)
      : [...currentSplitWith, member];
    form.setValue("splitWith", newSplitWith);
  };

  const toggleSelectAll = () => {
    const currentSplitWith = form.getValues("splitWith");
    const allSelected = currentSplitWith.length === members.length;

    if (allSelected) {
      // Unselect all
      form.setValue("splitWith", []);
    } else {
      // Select all
      form.setValue("splitWith", [...members]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("File must be an image");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<{ url: string; publicId: string }>(
        "/upload/image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Set the Cloudinary URL in the form
      form.setValue("qrImage", response.data.url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to upload image:", error);
      setUploadError(
        error.response?.data?.error ||
          "Failed to upload image. Please try again."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const modalContent = (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4'>
      <div className='relative bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in duration-200'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white'>
          <h2 className='text-2xl font-bold text-slate-900'>
            {editingExpense ? "Edit Expense" : "Add Expense"}
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 hover:text-slate-900'
            aria-label='Close modal'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='p-6 space-y-4 overflow-y-auto flex-1'
        >
          {/* Date */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              Date
            </label>
            <Input
              type='date'
              {...form.register("date")}
              className='w-full min-w-0 h-10 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 [-webkit-appearance:none] [appearance:none]'
              style={{ WebkitAppearance: "none", appearance: "none" }}
            />
          </div>

          {/* Paid By */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              Paid By *
            </label>
            <select
              {...form.register("paidBy")}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
            >
              {members.map((member) => (
                <option key={member} value={member}>
                  {getDisplayName(member)}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              Amount (PHP) *
            </label>
            <input
              type='number'
              step='0.01'
              {...form.register("amount")}
              placeholder='0.00'
              className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
            />
          </div>

          {/* Description */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              Description *
            </label>
            <input
              type='text'
              {...form.register("description")}
              placeholder='e.g., Hotel booking, Restaurant'
              className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
            />
          </div>

          {/* Category */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              Category
            </label>
            <select
              {...form.register("category")}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
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
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              Split Among (who should pay back?)
            </label>
            <div className='space-y-2'>
              {/* Select All / Unselect All */}
              <label className='flex items-center gap-2 cursor-pointer pb-2 border-b border-slate-200'>
                <input
                  type='checkbox'
                  checked={
                    form.watch("splitWith").length === members.length &&
                    members.length > 0
                  }
                  onChange={toggleSelectAll}
                  className='w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500'
                />
                <span className='text-sm font-medium text-slate-700'>
                  {form.watch("splitWith").length === members.length &&
                  members.length > 0
                    ? "Unselect All"
                    : "Select All"}
                </span>
              </label>

              {/* Individual member checkboxes */}
              {members.map((member) => (
                <label
                  key={member}
                  className='flex items-center gap-2 cursor-pointer'
                >
                  <input
                    type='checkbox'
                    checked={form.watch("splitWith").includes(member)}
                    onChange={() => toggleMember(member)}
                    className='w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500'
                  />
                  <span className='text-sm text-slate-700'>
                    {getDisplayName(member)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Method Section */}
          <div className='pt-4 border-t border-slate-200'>
            <div className='flex items-center gap-2 mb-2'>
              <label className='block text-sm font-medium text-slate-700'>
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
              className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 mb-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
            >
              <option value=''>Select payment method</option>
              <option value='cash'>💵 Cash</option>
              <option value='bank'>🏦 Bank Transfer</option>
              <option value='maya'>💳 Maya</option>
              <option value='gcash'>💰 GCash</option>
            </select>

            {form.watch("paymentMethod") &&
              form.watch("paymentMethod") !== "cash" && (
                <div className='space-y-3'>
                  {form.watch("paymentMethod") === "bank" && (
                    <div>
                      <label className='block text-sm font-medium text-slate-700 mb-1'>
                        Bank Name *
                      </label>
                      <input
                        type='text'
                        {...form.register("bankName")}
                        placeholder='e.g., BDO, BPI, Metrobank'
                        className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                      />
                    </div>
                  )}

                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1'>
                      Account Name{" "}
                      {form.watch("paymentMethod") === "bank"
                        ? "*"
                        : "(Optional)"}
                    </label>
                    <input
                      type='text'
                      {...form.register("accountName")}
                      placeholder='Full name on account'
                      className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1'>
                      Account Number
                    </label>
                    <input
                      type='text'
                      {...form.register("accountNumber")}
                      placeholder={`Enter account number`}
                      className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                    />
                  </div>

                  {/* QR Code Upload */}
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1'>
                      QR Code (Optional)
                    </label>
                    <div className='flex items-center gap-2'>
                      <label
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 transition-colors ${
                          uploadingImage
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer hover:bg-slate-50"
                        }`}
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className='w-4 h-4 animate-spin' />
                            <span className='text-sm'>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className='w-4 h-4' />
                            <span className='text-sm'>
                              {form.watch("qrImage")
                                ? "Change QR"
                                : "Upload QR"}
                            </span>
                          </>
                        )}
                        <input
                          type='file'
                          accept='image/*'
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className='hidden'
                        />
                      </label>
                    </div>
                    {uploadError && (
                      <p className='mt-2 text-sm text-red-600'>{uploadError}</p>
                    )}
                    {form.watch("qrImage") && (
                      <div className='mt-2 relative'>
                        <Image
                          src={form.watch("qrImage") || "/placeholder.svg"}
                          alt='QR Code'
                          width={128}
                          height={128}
                          className='w-32 h-32 object-contain rounded border cursor-pointer hover:opacity-80 transition-opacity'
                          onClick={() => setShowImageModal(true)}
                        />
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            form.setValue("qrImage", "");
                            setUploadError(null);
                          }}
                          className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10'
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
          <div className='pt-4 border-t border-slate-200'>
            <button
              type='submit'
              disabled={
                createExpenseMutation.isPending ||
                updateExpenseMutation.isPending
              }
              className='w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {createExpenseMutation.isPending ||
              updateExpenseMutation.isPending
                ? "Saving..."
                : editingExpense
                ? "Update Expense"
                : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!mounted || typeof window === "undefined") {
    return null;
  }

  return (
    <>
      {createPortal(modalContent, document.body)}
      {showImageModal &&
        form.watch("qrImage") &&
        createPortal(
          <div
            className='fixed inset-0 bg-black/90 backdrop-blur-sm z-[10000] flex items-center justify-center p-4'
            onClick={() => setShowImageModal(false)}
          >
            <div className='relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center'>
              <button
                onClick={() => setShowImageModal(false)}
                className='absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white z-10'
              >
                <X className='w-6 h-6' />
              </button>
              <Image
                src={form.watch("qrImage") || "/placeholder.svg"}
                alt='QR Code - Full View'
                width={800}
                height={800}
                className='max-w-full max-h-full object-contain rounded-lg'
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default AddExpenseModal;
