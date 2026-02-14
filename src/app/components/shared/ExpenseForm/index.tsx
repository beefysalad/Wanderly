"use client";

import { Expense, Activity } from "@/src/shared/types";
import React, { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { expenseSchema, TExpenseSchema } from "./expenseSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  HelpCircle,
  Upload,
  X,
  Loader2,
  Users,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Calendar,
  DollarSign,
  AlignLeft,
  Wallet,
  Building,
  User,
  Hash,
  Link as LinkIcon,
} from "lucide-react";
import Image from "next/image";
import { useCreateExpense, useUpdateExpense } from "@/src/hooks/useExpenses";
import api from "@/lib/axios";
import { formatTime12Hour } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface IExpenseFormProps {
  tripId: string;
  groupId: string;
  members: string[];
  memberNames?: Record<string, string>;
  activities?: Activity[];
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Expense;
  hideHeader?: boolean;
}

const steps = [
  { id: 1, title: "Details", icon: DollarSign },
  { id: 2, title: "Split", icon: Users },
  { id: 3, title: "Payment", icon: CreditCard },
];

const ExpenseForm = ({
  tripId,
  groupId,
  members,
  memberNames,
  activities = [],
  onSuccess,
  onCancel,
  initialData,
  hideHeader = false,
}: IExpenseFormProps) => {
  const getDisplayName = (email: string): string => {
    return memberNames?.[email] || email.split("@")[0];
  };

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);

  const createExpenseMutation = useCreateExpense(tripId, groupId);
  const updateExpenseMutation = useUpdateExpense(
    tripId,
    initialData?.id || "",
    groupId,
  );

  const form = useForm<TExpenseSchema>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      accountName: "",
      accountNumber: "",
      amount: "",
      bankName: "",
      category: "food",
      date: new Date().toISOString().split("T")[0],
      description: "",
      paidBy: members[0] || "",
      paymentMethod: "",
      qrImage: "",
      splitWith: members, // Default to split with everyone
      activityId: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        accountName: initialData.accountName || "",
        accountNumber: initialData.accountNumber || "",
        amount: initialData.amount.toString(),
        bankName: initialData.bankName || "",
        category: initialData.category || "other",
        date: new Date(initialData.date).toISOString().split("T")[0],
        description: initialData.description,
        paidBy: initialData.paidBy,
        paymentMethod: initialData.paymentMethod || "",
        qrImage: initialData.qrImage || "",
        splitWith: initialData.splitWith || [],
        activityId: initialData.activityId || "",
      });
    }
  }, [initialData, form, members]);

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      const dateCompare =
        new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      const timeA = a.startTime || "00:00";
      const timeB = b.startTime || "00:00";
      return timeA.localeCompare(timeB);
    });
  }, [activities]);

  const formatActivityDisplay = (activity: Activity): string => {
    const date = new Date(activity.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (activity.startTime) {
      return `${activity.title} - ${date} (${formatTime12Hour(
        activity.startTime,
      )})`;
    }
    return `${activity.title} - ${date}`;
  };

  const handleNext = async () => {
    const fieldsToValidate =
      currentStep === 1
        ? ["date", "paidBy", "amount", "description", "category"]
        : currentStep === 2
          ? ["splitWith"]
          : ["accountNumber"]; // Partial validation for step 3 if needed

    // @ts-ignore
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid && currentStep < 3) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (values: TExpenseSchema) => {
    if (currentStep !== 3) {
      handleNext();
      return;
    }

    try {
      const expenseData = {
        paidBy: values.paidBy,
        amount: Number(values.amount),
        description: values.description,
        date: new Date(values.date).toISOString(),
        category: values.category || undefined,
        paymentMethod: !values.paymentMethod
          ? undefined
          : (values.paymentMethod as "cash" | "bank" | "maya" | "gcash"),
        accountNumber: values.accountNumber || undefined,
        bankName: values.bankName || undefined,
        accountName: values.accountName || undefined,
        qrImage: values.qrImage || undefined,
        splitWith: values.splitWith,
        activityId: values.activityId || undefined,
      };

      if (initialData) {
        await updateExpenseMutation.mutateAsync(expenseData);
      } else {
        await createExpenseMutation.mutateAsync(expenseData);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save expense:", error);
    }
  };

  const toggleMember = (member: string) => {
    const currentSplitWith = form.getValues("splitWith");
    const newSplitWith = currentSplitWith.includes(member)
      ? currentSplitWith.filter((m) => m !== member)
      : [...currentSplitWith, member];
    form.setValue("splitWith", newSplitWith, { shouldValidate: true });
  };

  const toggleSelectAll = () => {
    const currentSplitWith = form.getValues("splitWith");
    const allSelected = currentSplitWith.length === members.length;
    form.setValue("splitWith", allSelected ? [] : [...members], {
      shouldValidate: true,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("File must be an image");
      return;
    }

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
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      form.setValue("qrImage", response.data.url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to upload image:", error);
      setUploadError(error.response?.data?.error || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <div className='flex flex-col h-full bg-slate-900 text-white rounded-3xl overflow-hidden border border-white/5 shadow-2xl'>
      {/* Header */}
      {!hideHeader && (
        <div className='px-6 py-5 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl z-20'>
          <div>
            <h2 className='text-xl font-bold text-white'>
              {initialData ? "Edit Expense" : "Add New Expense"}
            </h2>
            <p className='text-xs text-slate-400'>
              Step {currentStep} of {steps.length}:{" "}
              {steps[currentStep - 1].title}
            </p>
          </div>
          <button
            onClick={onCancel}
            className='p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div className='h-1 bg-slate-800 w-full relative'>
        <motion.div
          className='absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-500 to-amber-500'
          initial={{ width: `${((currentStep - 1) / steps.length) * 100}%` }}
          animate={{ width: `${(currentStep / steps.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Form Content */}
      <div className='flex-1 overflow-hidden relative'>
        <form
          className='h-full flex flex-col'
          onSubmit={(e) => e.preventDefault()}
        >
          <div className='flex-1 overflow-y-auto p-6 scrollbar-hide'>
            <AnimatePresence initial={false} custom={direction} mode='wait'>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={variants}
                initial='enter'
                animate='center'
                exit='exit'
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className='space-y-6'
              >
                {/* STEP 1: Details */}
                {currentStep === 1 && (
                  <div className='space-y-5'>
                    {/* Amount Input */}
                    <div className='relative'>
                      <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
                        Amount
                      </label>
                      <div className='relative group'>
                        <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                          <span className='text-slate-400 font-semibold text-lg'>
                            ₱
                          </span>
                        </div>
                        <input
                          type='number'
                          step='0.01'
                          {...form.register("amount")}
                          placeholder='0.00'
                          className='w-full pl-10 pr-4 py-4 bg-slate-800/50 border border-white/10 rounded-2xl text-3xl font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all'
                          autoFocus
                        />
                      </div>
                      {form.formState.errors.amount && (
                        <p className='mt-2 text-sm text-red-400 flex items-center gap-1'>
                          <span className='w-1 h-1 rounded-full bg-red-400 inline-block' />
                          {form.formState.errors.amount.message}
                        </p>
                      )}
                    </div>

                    {/* Description Input */}
                    <div>
                      <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
                        Description
                      </label>
                      <div className='relative'>
                        <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                          <AlignLeft className='w-5 h-5 text-slate-500' />
                        </div>
                        <input
                          type='text'
                          {...form.register("description")}
                          placeholder='What is this for?'
                          className='w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium'
                        />
                      </div>
                      {form.formState.errors.description && (
                        <p className='mt-2 text-sm text-red-400'>
                          {form.formState.errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      {/* Date Input */}
                      <div>
                        <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
                          Date
                        </label>
                        <div className='relative'>
                          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                            <Calendar className='w-4 h-4 text-slate-500' />
                          </div>
                          <input
                            type='date'
                            {...form.register("date")}
                            className='w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all'
                            style={{ colorScheme: "dark" }}
                          />
                        </div>
                      </div>

                      {/* Category Selection */}
                      <div>
                        <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
                          Category
                        </label>
                        <div className='relative'>
                          <select
                            {...form.register("category")}
                            className='w-full px-3 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all appearance-none'
                          >
                            <option value='accommodation'>
                              🏨 Accommodation
                            </option>
                            <option value='food'>🍽️ Food & Dining</option>
                            <option value='transport'>🚗 Transport</option>
                            <option value='activities'>🎯 Activities</option>
                            <option value='other'>📌 Other</option>
                          </select>
                          <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                            <ChevronRight className='w-4 h-4 text-slate-500 rotate-90' />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Paid By */}
                    <div>
                      <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
                        Paid By
                      </label>
                      <div className='relative'>
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                          <User className='w-4 h-4 text-slate-500' />
                        </div>
                        <select
                          {...form.register("paidBy")}
                          className='w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all appearance-none'
                        >
                          {members.map((member) => (
                            <option key={member} value={member}>
                              {getDisplayName(member)}
                            </option>
                          ))}
                        </select>
                        <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                          <ChevronRight className='w-4 h-4 text-slate-500 rotate-90' />
                        </div>
                      </div>
                    </div>

                    {/* Activity Link */}
                    {sortedActivities.length > 0 && (
                      <div>
                        <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2'>
                          <span>Link to Activity</span>
                          <span className='text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500'>
                            Optional
                          </span>
                        </label>
                        <div className='relative'>
                          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                            <LinkIcon className='w-4 h-4 text-slate-500' />
                          </div>
                          <select
                            {...form.register("activityId")}
                            className='w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all appearance-none'
                          >
                            <option value=''>No activity linked</option>
                            {sortedActivities.map((activity) => (
                              <option key={activity.id} value={activity.id}>
                                {formatActivityDisplay(activity)}
                              </option>
                            ))}
                          </select>
                          <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                            <ChevronRight className='w-4 h-4 text-slate-500 rotate-90' />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: Split */}
                {currentStep === 2 && (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <label className='text-sm font-semibold text-slate-300'>
                        Select Members
                      </label>
                      <button
                        type='button'
                        onClick={toggleSelectAll}
                        className='text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors'
                      >
                        {form.watch("splitWith").length === members.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>

                    <div className='space-y-2 max-h-[400px] overflow-y-auto pr-2'>
                      {members.map((member) => {
                        const isSelected = form
                          .watch("splitWith")
                          .includes(member);
                        return (
                          <motion.div
                            key={member}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleMember(member)}
                            className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "bg-slate-800 border-orange-500/50 shadow-lg shadow-orange-500/5"
                                : "bg-slate-800/30 border-white/5 hover:bg-slate-800/50"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 transition-colors ${
                                isSelected
                                  ? "bg-orange-500 border-orange-500"
                                  : "border-slate-500"
                              }`}
                            >
                              {isSelected && (
                                <CheckCircle className='w-3.5 h-3.5 text-white' />
                              )}
                            </div>
                            <div className='flex-1'>
                              <p
                                className={`font-medium text-sm ${isSelected ? "text-white" : "text-slate-400"}`}
                              >
                                {getDisplayName(member)}
                              </p>
                              <p className='text-xs text-slate-500'>{member}</p>
                            </div>
                            {isSelected && (
                              <span className='text-xs font-medium text-orange-400'>
                                Split
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                    {form.formState.errors.splitWith && (
                      <p className='text-sm text-red-400 text-center'>
                        {form.formState.errors.splitWith.message}
                      </p>
                    )}
                  </div>
                )}

                {/* STEP 3: Payment Details */}
                {currentStep === 3 && (
                  <div className='space-y-6'>
                    <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3'>
                      <HelpCircle className='w-5 h-5 text-blue-400 flex-shrink-0' />
                      <p className='text-xs text-blue-200 leading-relaxed'>
                        Adding payment details helps others pay you back faster.
                        You can skip this if you recorded a cash payment or
                        don't need reimbursement yet.
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
                                form.setValue("paymentMethod", method as any);
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
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <div className='p-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl flex justify-between items-center z-20'>
            <button
              type='button'
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                currentStep === 1
                  ? "opacity-0 pointer-events-none"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Back
            </button>

            {currentStep < 3 ? (
              <button
                type='button'
                onClick={handleNext}
                className='px-6 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-2 shadow-lg shadow-white/5'
              >
                Next Step
                <ChevronRight className='w-4 h-4' />
              </button>
            ) : (
              <button
                type='button'
                onClick={form.handleSubmit(onSubmit)}
                disabled={
                  createExpenseMutation.isPending ||
                  updateExpenseMutation.isPending
                }
                className='px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-bold hover:from-orange-400 hover:to-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {createExpenseMutation.isPending ||
                updateExpenseMutation.isPending ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className='w-4 h-4' />
                    {initialData ? "Update Expense" : "Create Expense"}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Image Modal */}
      {showImageModal && form.watch("qrImage") && (
        <div
          className='fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm'
          onClick={() => setShowImageModal(false)}
        >
          <div className='relative max-w-2xl w-full max-h-[90vh]'>
            <button
              onClick={() => setShowImageModal(false)}
              className='absolute -top-12 right-0 text-white/70 hover:text-white transition-colors'
            >
              <X className='w-8 h-8' />
            </button>
            <Image
              src={form.watch("qrImage") || ""}
              alt='QR Code Full'
              width={800}
              height={800}
              className='object-contain w-full h-full rounded-2xl'
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseForm;
