"use client";
import { Expense } from "@/src/shared/types";
import { CheckCircle, Copy, Download, Pencil, Trash2, X } from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";
interface IExpenseDetailModalProps {
  expense: Expense;
  members: string[];
  memberNames?: Record<string, string>; // email -> name mapping
  onClose: () => void;
  onMarkPaid: (memberId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  currentUser?: string;
}

const categoryEmojis = {
  accommodation: "🏨",
  food: "🍽️",
  transportation: "🚗",
  activities: "🎯",
  other: "📌",
};
const ExpenseDetailModal = ({
  expense,
  members,
  memberNames,
  onClose,
  onDelete,
  onEdit,
  onMarkPaid,
  currentUser,
}: IExpenseDetailModalProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper function to get display name from email
  const getDisplayName = (email: string): string => {
    return memberNames?.[email] || email.split("@")[0];
  };

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadQRCode = () => {
    if (!expense.qrImage) return;

    const link = document.createElement("a");
    link.href = expense.qrImage;
    link.download = `payment-qr-${expense.description
      .replace(/\s+/g, "-")
      .toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const splitCount = expense.splitWith?.length || members.length;
  const perPersonAmount = expense.amount / splitCount;
  const paidMembers = expense.paidMembers || [];
  
  return (
    <div
      className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-orange-600 to-amber-600 p-6 rounded-t-2xl'>
          <div className='flex items-start justify-between mb-4'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <span className='text-4xl'>
                  {categoryEmojis[
                    expense.category as keyof typeof categoryEmojis
                  ] || "📌"}
                </span>
                <div>
                  <h2 className='text-2xl font-bold text-white'>
                    {expense.description}
                  </h2>
                  <p className='text-orange-100 text-sm'>
                    {new Date(expense.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={onEdit}
                className='p-2 hover:bg-white/20 rounded-full transition-colors text-white'
                title='Edit expense'
              >
                <Pencil className='w-5 h-5' />
              </button>
              <button
                onClick={() => {
                  if (
                    confirm("Are you sure you want to delete this expense?")
                  ) {
                    onDelete();
                  }
                }}
                className='p-2 hover:bg-white/20 rounded-full transition-colors text-white'
                title='Delete expense'
              >
                <Trash2 className='w-5 h-5' />
              </button>
              <button
                onClick={onClose}
                className='p-2 hover:bg-white/20 rounded-full transition-colors text-white'
              >
                <X className='w-5 h-5' />
              </button>
            </div>
          </div>
          <div className='text-center'>
            <p className='text-emerald-100 text-sm mb-1'>Total Amount</p>
            <p className='text-4xl font-bold text-white'>
              ₱{expense.amount.toFixed(2)}
            </p>
            <p className='text-emerald-100 text-sm mt-1'>
              ₱{perPersonAmount.toFixed(2)} per person
            </p>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Paid By */}
          <div>
            <p className='text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2'>
              Paid By
            </p>
            <div className='bg-slate-50 dark:bg-slate-700 rounded-lg p-3'>
              <p className='font-semibold text-slate-900 dark:text-white'>
                {getDisplayName(expense.paidBy)}
              </p>
            </div>
          </div>

          {/* Split Among */}
          <div>
            <p className='text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2'>
              Split Among ({splitCount} {splitCount === 1 ? "person" : "people"}
              )
            </p>
            <div className='space-y-2'>
              {expense.splitWith?.map((member) => {
                const hasPaid = paidMembers.includes(member);
                const isPayer = member === expense.paidBy;
                const isCurrentUser = currentUser === member;

                return (
                  <div
                    key={member}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                      hasPaid || isPayer
                        ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                        : "bg-slate-50 dark:bg-slate-700 border-red-500 dark:border-red-600"
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-semibold'>
                        {member[0].toUpperCase()}
                      </div>
                      <div>
                        <p className='font-medium text-slate-900 dark:text-white'>
                          {getDisplayName(member)}
                          {isCurrentUser && " (You)"}
                        </p>
                        <p className='text-sm text-slate-600 dark:text-slate-400'>
                          ₱{perPersonAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div>
                      {isPayer ? (
                        <span className='text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium'>
                          Payer
                        </span>
                      ) : hasPaid ? (
                        <div className='flex items-center gap-1 text-orange-600 dark:text-orange-400'>
                          <CheckCircle className='w-5 h-5' />
                          <span className='text-sm font-medium'>Paid</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onMarkPaid(member)}
                          className='px-3 py-1 text-sm rounded-full border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white transition-colors font-medium'
                        >
                          Mark as Paid
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Details */}
          {expense.paymentMethod && (
            <div className='border-t border-slate-200 dark:border-slate-700 pt-6'>
              <p className='text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-3'>
                Payment Details
              </p>
              <div className='bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800'>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <span className='text-2xl'>
                      {expense.paymentMethod === "cash" && "💵"}
                      {expense.paymentMethod === "bank" && "🏦"}
                      {expense.paymentMethod === "maya" && "💳"}
                      {expense.paymentMethod === "gcash" && "💰"}
                    </span>
                    <p className='font-semibold text-slate-900 dark:text-white'>
                      {expense.paymentMethod === "cash" && "Cash"}
                      {expense.paymentMethod === "bank" && "Bank Transfer"}
                      {expense.paymentMethod === "maya" && "Maya"}
                      {expense.paymentMethod === "gcash" && "GCash"}
                    </p>
                  </div>
                  {expense.accountNumber && (
                    <div>
                      <p className='text-xs text-slate-600 dark:text-slate-400 mb-1'>
                        Account Number
                      </p>
                      <div className='flex items-center gap-2'>
                        <code className='flex-1 text-sm bg-white dark:bg-slate-700 px-3 py-2 rounded border border-slate-200 dark:border-slate-600 font-mono'>
                          {expense.accountNumber}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(expense.accountNumber!, "account")
                          }
                          className='p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors'
                          title='Copy account number'
                        >
                          {copiedId === "account" ? (
                            <CheckCircle className='w-5 h-5 text-orange-600' />
                          ) : (
                            <Copy className='w-5 h-5 text-slate-600 dark:text-slate-400' />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {expense.qrImage && (
                    <div>
                      <div className='flex items-center justify-between mb-2'>
                        <p className='text-xs text-slate-600 dark:text-slate-400'>
                          QR Code
                        </p>
                        <button
                          onClick={downloadQRCode}
                          className='flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors'
                        >
                          <Download className='w-4 h-4' />
                          Download
                        </button>
                      </div>
                      <Image
                        src={expense.qrImage || "/placeholder.svg"}
                        alt='Payment QR Code'
                        className='w-48 h-48 object-contain rounded-lg border border-slate-200 dark:border-slate-600 mx-auto bg-white'
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetailModal;
