import { Expense, Activity } from "@/src/shared/types";
import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { expenseSchema, TExpenseSchema } from "./addExpenseZod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  HelpCircle,
  Upload,
  X,
  Loader2,
  ChevronDown,
  Users,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useCreateExpense, useUpdateExpense } from "@/src/hooks/useExpenses";
import api from "@/lib/axios";
import { formatTime12Hour } from "@/lib/utils";

interface IAddExpenseModalProps {
  tripId: string;
  groupId: string;
  members: string[];
  memberNames?: Record<string, string>; // email -> name mapping
  activities?: Activity[]; // activities from the trip
  onAddExpense: () => void;
  onClose: () => void;
  editingExpense?: Expense;
}
const AddExpenseModal = ({
  tripId,
  groupId,
  members,
  memberNames,
  activities = [],
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
  const [currentStep, setCurrentStep] = useState(1);
  const [stepDirection, setStepDirection] = useState<"forward" | "backward">(
    "forward"
  );
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
      activityId: "",
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
        activityId: editingExpense.activityId || "",
      });

      // No need to set step state for editing - start at step 1
    }
  }, [editingExpense, form]);

  // Format activities for dropdown: sorted by date, then by startTime
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

  // Format activity display text
  const formatActivityDisplay = (activity: Activity): string => {
    const date = new Date(activity.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (activity.startTime) {
      return `${activity.title} - ${date} (${formatTime12Hour(
        activity.startTime
      )})`;
    }
    return `${activity.title} - ${date}`;
  };

  // Get summary text for Split Among section
  const getSplitSummary = (): string => {
    const splitWith = form.watch("splitWith");
    if (splitWith.length === 0) {
      return "No members selected";
    }
    if (splitWith.length === members.length) {
      return "All members";
    }
    return `${splitWith.length} member${
      splitWith.length > 1 ? "s" : ""
    } selected`;
  };

  // Get summary text for Payment Details section
  const getPaymentSummary = (): string => {
    const paymentMethod = form.watch("paymentMethod");
    if (!paymentMethod) {
      return "No payment method";
    }
    const methodLabels: Record<string, string> = {
      cash: "Cash",
      bank: "Bank Transfer",
      maya: "Maya",
      gcash: "GCash",
    };
    return methodLabels[paymentMethod] || "Payment method";
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return (
        form.formState.errors.date === undefined &&
        form.formState.errors.paidBy === undefined &&
        form.formState.errors.amount === undefined &&
        form.formState.errors.description === undefined
      );
    }
    if (step === 2) {
      // Step 2 is optional, no validation needed
      return true;
    }
    if (step === 3) {
      // Step 3 is optional, but validate if payment method is selected
      const paymentMethod = form.watch("paymentMethod");
      if (paymentMethod && paymentMethod !== "cash") {
        return form.formState.errors.accountNumber === undefined;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    // Trigger validation for current step
    const fieldsToValidate =
      currentStep === 1
        ? ["date", "paidBy", "amount", "description"]
        : currentStep === 2
        ? []
        : ["accountNumber"];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.trigger(fieldsToValidate as any).then((isValid) => {
      if (isValid && currentStep < 3) {
        setStepDirection("forward");
        setCurrentStep(currentStep + 1);
      }
    });
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStepDirection("backward");
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (values: TExpenseSchema) => {
    // Only allow submission on step 3
    if (currentStep !== 3) {
      handleNext();
      return;
    }

    try {
      if (editingExpense) {
        await updateExpenseMutation.mutateAsync({
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
        });
      } else {
        await createExpenseMutation.mutateAsync({
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
        <div className='flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10'>
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

        {/* Step Indicator */}
        <div className='px-6 py-4 border-b border-slate-200 bg-slate-50'>
          <div className='flex items-center justify-between'>
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className='flex items-center'>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                      currentStep >= step
                        ? "bg-orange-500 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {currentStep > step ? (
                      <CheckCircle className='w-5 h-5' />
                    ) : (
                      step
                    )}
                  </div>
                  <span
                    className={`ml-2 text-xs font-medium hidden sm:block ${
                      currentStep >= step ? "text-orange-600" : "text-slate-500"
                    }`}
                  >
                    {step === 1
                      ? "Basic Info"
                      : step === 2
                      ? "Split Among"
                      : "Payment"}
                  </span>
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                      currentStep > step ? "bg-orange-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only submit if we're on step 3 AND the submit button was explicitly clicked
            // This prevents auto-submission when reaching step 3
            return false;
          }}
          onKeyDown={(e) => {
            // Prevent Enter key from submitting form
            if (e.key === "Enter") {
              e.preventDefault();
              if (currentStep < 3) {
                handleNext();
              }
            }
          }}
          className='flex-1 flex flex-col overflow-hidden'
        >
          {/* Step Content */}
          <div className='flex-1 overflow-y-auto p-6'>
            <div
              key={currentStep}
              className={`transition-all duration-300 ${
                stepDirection === "forward"
                  ? "animate-in slide-in-from-right fade-in"
                  : "animate-in slide-in-from-left fade-in"
              }`}
            >
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1'>
                      Date *
                    </label>
                    <Input
                      type='date'
                      {...form.register("date")}
                      className='w-full min-w-0 h-10 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                      style={{ WebkitAppearance: "none", appearance: "none" }}
                    />
                    {form.formState.errors.date && (
                      <p className='mt-1 text-sm text-red-600'>
                        {form.formState.errors.date.message}
                      </p>
                    )}
                  </div>

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
                    {form.formState.errors.paidBy && (
                      <p className='mt-1 text-sm text-red-600'>
                        {form.formState.errors.paidBy.message}
                      </p>
                    )}
                  </div>

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
                    {form.formState.errors.amount && (
                      <p className='mt-1 text-sm text-red-600'>
                        {form.formState.errors.amount.message}
                      </p>
                    )}
                  </div>

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
                    {form.formState.errors.description && (
                      <p className='mt-1 text-sm text-red-600'>
                        {form.formState.errors.description.message}
                      </p>
                    )}
                  </div>

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
                </div>
              )}

              {/* Step 2: Split Among */}
              {currentStep === 2 && (
                <div className='space-y-4'>
                  <div>
                    <label className='flex items-center gap-2 text-sm font-medium text-slate-700 mb-3'>
                      <Users className='w-4 h-4 text-orange-500' />
                      Split Among (who should pay back?)
                    </label>
                    <div className='space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200'>
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

                  {sortedActivities.length > 0 && (
                    <div>
                      <label className='block text-sm font-medium text-slate-700 mb-1'>
                        Link to Activity
                        <span className='text-xs text-slate-500 ml-1'>
                          (optional)
                        </span>
                      </label>
                      <select
                        {...form.register("activityId")}
                        className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                      >
                        <option value=''>No activity link</option>
                        {sortedActivities.map((activity) => (
                          <option key={activity.id} value={activity.id}>
                            {formatActivityDisplay(activity)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Payment Details */}
              {currentStep === 3 && (
                <div className='space-y-4'>
                  <div>
                    <label className='flex items-center gap-2 text-sm font-medium text-slate-700 mb-3'>
                      <CreditCard className='w-4 h-4 text-orange-500' />
                      Payment Details
                      <div className='group relative'>
                        <HelpCircle className='w-3.5 h-3.5 text-slate-400 cursor-help' />
                        <div className='absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-xs rounded shadow-lg z-10'>
                          Add your payment details so others know how to pay you
                          back
                        </div>
                      </div>
                    </label>
                    <div className='space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200'>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Preferred Payment Method
                        </label>
                        <select
                          {...form.register("paymentMethod", {
                            onChange: (e) => {
                              const value = e.target.value as
                                | "bank"
                                | "maya"
                                | "gcash"
                                | "cash"
                                | "";
                              form.setValue("paymentMethod", value);
                              form.setValue("accountNumber", "");
                              form.setValue("bankName", "");
                              form.setValue("accountName", "");
                              form.setValue("qrImage", "");
                            },
                          })}
                          className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                        >
                          <option value=''>Select payment method</option>
                          <option value='cash'>💵 Cash</option>
                          <option value='bank'>🏦 Bank Transfer</option>
                          <option value='maya'>💳 Maya</option>
                          <option value='gcash'>💰 GCash</option>
                        </select>
                      </div>

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

                            <div>
                              <label className='block text-sm font-medium text-slate-700 mb-1'>
                                Account Number *
                              </label>
                              <input
                                type='text'
                                {...form.register("accountNumber")}
                                placeholder='Enter account number'
                                className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                              />
                              {form.formState.errors.accountNumber && (
                                <p className='mt-1 text-sm text-red-600'>
                                  {form.formState.errors.accountNumber.message}
                                </p>
                              )}
                            </div>

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
                                      <span className='text-sm'>
                                        Uploading...
                                      </span>
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
                                <p className='mt-2 text-sm text-red-600'>
                                  {uploadError}
                                </p>
                              )}
                              {form.watch("qrImage") && (
                                <div className='mt-2 relative'>
                                  <Image
                                    src={
                                      form.watch("qrImage") ||
                                      "/placeholder.svg"
                                    }
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
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className='border-t border-slate-200 p-6 flex items-center justify-between gap-3 bg-white'>
            <button
              type='button'
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                currentStep === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              <ChevronLeft className='w-4 h-4' />
              Back
            </button>
            {currentStep < 3 ? (
              <button
                type='button'
                onClick={handleNext}
                className='flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg'
              >
                Next
                <ChevronRight className='w-4 h-4' />
              </button>
            ) : (
              <button
                type='button'
                onClick={async () => {
                  // Validate step 3 fields first
                  const isValid = await form.trigger(["accountNumber"]);
                  if (isValid) {
                    // Only submit if validation passes
                    const values = form.getValues();
                    await onSubmit(values);
                  }
                }}
                disabled={
                  createExpenseMutation.isPending ||
                  updateExpenseMutation.isPending
                }
                className='flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {createExpenseMutation.isPending ||
                updateExpenseMutation.isPending
                  ? "Saving..."
                  : editingExpense
                  ? "Update Expense"
                  : "Add Expense"}
              </button>
            )}
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
