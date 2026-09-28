"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Activity, Expense } from "@/src/shared/types";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import { payerIdentity } from "../Expenses/expenseView";
import { isUserInvolved, shareOf } from "../Expenses/expenseStats";
import { ExpenseHero } from "./ExpenseHero";
import { ItemMenu } from "../../shared/ItemMenu";
import { PayWithCard, YourShareCard } from "./PaymentSide";
import { WhoOwesWhat, type OwesRow } from "./WhoOwesWhat";
import { memberStatus, paidBack, shareBox, splitMembers } from "./expenseDetailView";

interface IExpenseDetailProps {
  expense: Expense;
  memberNames?: Record<string, string>; // email -> name mapping
  memberMetadata?: Record<string, { joinedAt: string; name?: string; imageUrl?: string }>; // email -> metadata with imageUrl
  activities?: Activity[]; // activities from the trip
  onMarkPaid?: (memberId: string) => void;
  onConfirmPayment?: (memberEmail: string, status: "confirmed" | "rejected") => void;
  onRecordGuestPayment?: (member: string, isPaid: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  currentUser?: string;
  readOnly?: boolean;
}

/**
 * The body of the expense page (the page around it supplies the app chrome): the amount and who paid, each
 * person's share and payment status, and on the side your share and how to pay.
 */
const ExpenseDetail = ({
  expense,
  memberNames,
  memberMetadata,
  activities = [],
  onDelete,
  onEdit,
  onMarkPaid,
  onConfirmPayment,
  onRecordGuestPayment,
  currentUser = "",
  readOnly = false,
}: IExpenseDetailProps) => {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const identityMaps = { memberNames, memberMetadata };
  const payer = payerIdentity(identityMaps, expense.paidBy, currentUser);
  const linkedActivity = expense.activityId ? activities.find((activity) => activity.id === expense.activityId) : undefined;
  const rows: OwesRow[] = splitMembers(expense).map((email) => {
    const person = payerIdentity(identityMaps, email, currentUser);
    const share = isUserInvolved(expense, email) ? shareOf(expense, email) : null;
    const isGuest = expense.splits.find((split) => split.member === email)?.isGuest ?? false;
    return { email, name: person.name, imageUrl: person.imageUrl, status: memberStatus(expense, email), share, isYou: person.isYou, isGuest };
  });

  const box = shareBox(expense, currentUser, payer.short);
  const canManage = !readOnly && (onEdit || onDelete);
  // Mirrors the server rule: only the expense's creator or payer may record a guest's payment.
  const canRecordGuestPayments =
    !readOnly && !!currentUser && (currentUser === expense.createdBy?.email || currentUser === expense.paidBy);

  return (
    <div className='flex flex-wrap items-start gap-6'>
      <div className='flex min-w-0 flex-[999_1_440px] flex-col gap-[18px]'>
        <ExpenseHero
          expense={expense}
          payer={payer}
          linkedActivity={linkedActivity}
          onOpenActivity={
            readOnly ? undefined : (activity) => router.push(`/group/${expense.groupId}/trip/${expense.tripId}/activities/${activity.id}`)
          }
          ways={expense.splits.length}
          paidBack={paidBack(expense)}
          menu={canManage ? <ItemMenu noun='expense' onEdit={onEdit} onDelete={onDelete ? () => setShowDeleteConfirm(true) : undefined} /> : undefined}
        />
        <WhoOwesWhat
          rows={rows}
          canConfirm={!readOnly && (currentUser === expense.paidBy || (!!expense.paidByIsGuest && canRecordGuestPayments))}
          onConfirm={onConfirmPayment}
          canRecordGuestPayments={canRecordGuestPayments}
          onRecordGuestPayment={onRecordGuestPayment}
        />
      </div>

      <div className='flex min-w-0 flex-[1_1_280px] flex-col gap-[14px]'>
        {readOnly ? null : (
          <YourShareCard box={box} onMarkPaid={onMarkPaid ? () => onMarkPaid(currentUser) : undefined} />
        )}
        <PayWithCard expense={expense} payerShort={payer.short} />
      </div>

      {showDeleteConfirm && onDelete ? (
        <ConfirmDeleteModal
          title='Delete Expense'
          message={`Are you sure you want to delete "${expense.description}"? This action cannot be undone.`}
          onConfirm={() => {
            setShowDeleteConfirm(false);
            onDelete();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText='Delete Expense'
        />
      ) : null}
    </div>
  );
};

export default ExpenseDetail;
