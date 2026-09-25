import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateExpense, useUpdateExpense } from "@/src/hooks/useExpenses";
import type { Expense } from "@/src/shared/types";
import { expenseSchema, type TExpenseSchema } from "./expenseSchema";
import { LAST_STEP } from "./steps";

interface IUseExpenseFormArgs {
  tripId: string;
  groupId: string;
  members: string[];
  initialData?: Expense;
  onSuccess: () => void;
}

export function useExpenseForm({
  tripId,
  groupId,
  members,
  initialData,
  onSuccess,
}: IUseExpenseFormArgs) {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);

  const createExpenseMutation = useCreateExpense(tripId, groupId);
  const updateExpenseMutation = useUpdateExpense(tripId, initialData?.id || "", groupId);

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

  const handleNext = async () => {
    const fieldsToValidate =
      currentStep === 1
        ? ["date", "paidBy", "amount", "description", "category"]
        : currentStep === 2
          ? ["splitWith"]
          : ["accountNumber"]; // Partial validation for step 3 if needed

    // @ts-expect-error - Trigger validation for specific fields
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid && currentStep < LAST_STEP) {
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
    if (currentStep !== LAST_STEP) {
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

  return {
    form,
    currentStep,
    direction,
    isSaving: createExpenseMutation.isPending || updateExpenseMutation.isPending,
    handleNext,
    handleBack,
    onSubmit,
    toggleMember,
    toggleSelectAll,
  };
}
