import { CreditCard, DollarSign, Users, type LucideIcon } from "lucide-react";

export interface ExpenseFormStep {
  number: number;
  title: string;
  icon: LucideIcon;
  description: string;
}

export const EXPENSE_FORM_STEPS: ExpenseFormStep[] = [
  {
    number: 1,
    title: "Details",
    icon: DollarSign,
    description: "Amount & Info",
  },
  {
    number: 2,
    title: "Split",
    icon: Users,
    description: "Share the cost",
  },
  {
    number: 3,
    title: "Payment",
    icon: CreditCard,
    description: "Method & Proof",
  },
];

export const LAST_STEP = EXPENSE_FORM_STEPS.length;

export const STEP_VARIANTS = {
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
