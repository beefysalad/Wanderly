"use client";
import { Expense, Activity } from "@/src/shared/types";
import {
  CheckCircle,
  Copy,
  Download,
  Pencil,
  Trash2,
  X,
  Link2,
  Calendar,
  Clock,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import { formatTime12Hour } from "@/lib/utils";

interface IExpenseDetailModalProps {
  expense: Expense;
  members: string[];
  memberNames?: Record<string, string>; // email -> name mapping
  memberMetadata?: Record<string, { joinedAt: string; name?: string; imageUrl?: string }>; // email -> metadata with imageUrl
  activities?: Activity[]; // activities from the trip
  onClose: () => void;
  onMarkPaid?: (memberId: string) => void;
  onConfirmPayment?: (memberEmail: string, status: "confirmed" | "rejected") => void;
  onEdit?: () => void;
  onDelete?: () => void;
  currentUser?: string;
  readOnly?: boolean;
}

const categoryEmojis: Record<string, string> = {
  accommodation: "🏨",
  food: "🍽️",
  transportation: "🚗",
  transport: "🚗", // alias for transportation
  activities: "🎯",
  other: "📌",
};
const ExpenseDetailModal = ({
  expense,
  members,
  memberNames,
  memberMetadata,
  activities = [],
  onClose,
  onDelete,
  onEdit,
  onMarkPaid,
  onConfirmPayment,
  currentUser,
  readOnly = false,
}: IExpenseDetailModalProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Helper function to get display name from email
  const getDisplayName = (email: string): string => {
    return memberNames?.[email] || email.split("@")[0];
  };

  // Helper function to get member avatar
  const getMemberAvatar = (email: string) => {
    return memberMetadata?.[email]?.imageUrl;
  };

  // Helper function to get member initials
  const getMemberInitials = (email: string): string => {
    const name = memberNames?.[email] || email.split("@")[0];
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get linked activity
  const linkedActivity = expense.activityId
    ? activities.find((a) => a.id === expense.activityId)
    : undefined;

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

  const downloadQRCode = async () => {
    if (!expense.qrImage) return;

    try {
      // Fetch the image as a blob
      const response = await fetch(expense.qrImage);
      const blob = await response.blob();

      // Create a blob URL
      const blobUrl = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `payment-qr-${expense.description
        .replace(/\s+/g, "-")
        .toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  const splitCount = expense.splitWith?.length || members.length;
  const perPersonAmount = expense.amount / splitCount;
  const paidMembers = expense.paidMembers || [];
  const pendingPayments = expense.pendingPayments || [];
  const paymentStatusMap = expense.paymentStatusMap || {};
  const isPayer = currentUser === expense.paidBy;

  return (
    <div
      className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[75vh] flex flex-col overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex-shrink-0 bg-gradient-to-r from-orange-600 to-amber-600 p-6 rounded-t-2xl relative z-10'>
          <div className='flex items-start justify-between mb-4'>
            <div className='flex-1 min-w-0 pr-4'>
              <div className='flex items-center gap-3 mb-2'>
                <span className='text-4xl flex-shrink-0'>
                  {expense.category
                    ? categoryEmojis[expense.category] || "📌"
                    : "📌"}
                </span>
                <div className='min-w-0 flex-1'>
                  <h2 className='text-2xl font-bold text-white break-words'>
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
            <div className='flex items-center gap-2 flex-shrink-0 relative z-20'>
              {!readOnly && onEdit && (
                <button
                  onClick={onEdit}
                  className='p-2 hover:bg-white/20 rounded-full transition-colors text-white relative z-10'
                  title='Edit expense'
                >
                  <Pencil className='w-5 h-5' />
                </button>
              )}
              {!readOnly && onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className='p-2 hover:bg-white/20 rounded-full transition-colors text-white relative z-10'
                  title='Delete expense'
                >
                  <Trash2 className='w-5 h-5' />
                </button>
              )}
              <button
                onClick={onClose}
                className='p-2 hover:bg-white/20 rounded-full transition-colors text-white relative z-10'
                title='Close'
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
        <div className='p-6 space-y-6 overflow-y-auto overflow-x-hidden flex-1'>
          {/* Linked Activity */}
          {linkedActivity && (
            <div>
              <p className='text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2'>
                Linked Activity
              </p>
              <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800'>
                <div className='flex items-start gap-2'>
                  <Link2 className='w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0' />
                  <div className='flex-1'>
                    <p className='font-semibold text-slate-900 dark:text-white mb-1'>
                      {linkedActivity.title}
                    </p>
                    <div className='flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400'>
                      <Calendar className='w-3 h-3' />
                      <span>
                        {new Date(linkedActivity.date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                      {linkedActivity.startTime && (
                        <>
                          <span>•</span>
                          <span>
                            {formatTime12Hour(linkedActivity.startTime)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paid By */}
          <div>
            <p className='text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2'>
              Paid By
            </p>
            <div className='bg-slate-50 dark:bg-slate-700 rounded-lg p-3'>
              <div className='flex items-center gap-3'>
                {getMemberAvatar(expense.paidBy) ? (
                  <div className='relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-600 flex-shrink-0'>
                    <Image
                      src={getMemberAvatar(expense.paidBy)!}
                      alt={getDisplayName(expense.paidBy)}
                      fill
                      className='object-cover'
                    />
                  </div>
                ) : (
                  <div className='w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-semibold flex-shrink-0'>
                    {getMemberInitials(expense.paidBy)}
                  </div>
                )}
                <p className='font-semibold text-slate-900 dark:text-white'>
                  {getDisplayName(expense.paidBy)}
                </p>
              </div>
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
                const memberIsPayer = member === expense.paidBy;
                const isCurrentUser = currentUser === member;
                const paymentStatus = paymentStatusMap[member];
                const hasPaid = paidMembers.includes(member);
                const isPending = paymentStatus === "pending" || pendingPayments.includes(member);
                const isRejected = paymentStatus === "rejected";
                const showMarkAsPaid = !readOnly && onMarkPaid && isCurrentUser && !memberIsPayer && !hasPaid && !isPending;
                const showConfirmButtons = !readOnly && onConfirmPayment && isPayer && isPending && !memberIsPayer;

                // Determine border color based on status
                let borderColor = "border-red-500 dark:border-red-600";
                let bgColor = "bg-slate-50 dark:bg-slate-700";
                if (hasPaid || memberIsPayer) {
                  borderColor = "border-orange-200 dark:border-orange-800";
                  bgColor = "bg-orange-50 dark:bg-orange-900/20";
                } else if (isPending) {
                  borderColor = "border-amber-400 dark:border-amber-600";
                  bgColor = "bg-amber-50 dark:bg-amber-900/20";
                } else if (isRejected) {
                  borderColor = "border-red-400 dark:border-red-600";
                  bgColor = "bg-red-50 dark:bg-red-900/20";
                }

                return (
                  <div
                    key={member}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 ${bgColor} ${borderColor}`}
                  >
                    <div className='flex items-center gap-3 min-w-0 flex-1'>
                      {getMemberAvatar(member) ? (
                        <div className='relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 flex-shrink-0'>
                          <Image
                            src={getMemberAvatar(member)!}
                            alt={getDisplayName(member)}
                            fill
                            className='object-cover'
                          />
                        </div>
                      ) : (
                        <div className='w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-semibold'>
                          {getMemberInitials(member)}
                        </div>
                      )}
                      <div className='min-w-0 flex-1'>
                        <p className='font-medium text-slate-900 dark:text-white break-words'>
                          {getDisplayName(member)}
                          {isCurrentUser && " (You)"}
                        </p>
                        <p className='text-sm text-slate-600 dark:text-slate-400'>
                          ₱{perPersonAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      {memberIsPayer ? (
                        <span className='text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium'>
                          Payer
                        </span>
                      ) : hasPaid ? (
                        <div className='flex items-center gap-1 text-orange-600 dark:text-orange-400'>
                          <CheckCircle className='w-5 h-5' />
                          <span className='text-sm font-medium'>Paid</span>
                        </div>
                      ) : isPending ? (
                        <div className='flex flex-col items-end gap-1'>
                          <div className='flex items-center gap-1 text-amber-600 dark:text-amber-400'>
                            <Clock className='w-4 h-4' />
                            <span className='text-xs font-medium'>Pending</span>
                          </div>
                          {showConfirmButtons && (
                            <div className='flex items-center gap-1'>
                              <button
                                onClick={() => onConfirmPayment(member, "confirmed")}
                                className='px-2 py-0.5 text-xs rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors font-medium'
                                title='Confirm payment'
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => onConfirmPayment(member, "rejected")}
                                className='px-2 py-0.5 text-xs rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors font-medium'
                                title='Reject payment'
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ) : isRejected ? (
                        <div className='flex items-center gap-1 text-red-600 dark:text-red-400'>
                          <XCircle className='w-5 h-5' />
                          <span className='text-sm font-medium'>Rejected</span>
                        </div>
                      ) : showMarkAsPaid ? (
                        <button
                          onClick={() => onMarkPaid(member)}
                          className='px-3 py-1 text-sm rounded-full border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white transition-colors font-medium'
                        >
                          Mark as Paid
                        </button>
                      ) : (
                        <span className='text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium'>
                          Unpaid
                        </span>
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
                        <code className='flex-1 text-sm bg-white dark:bg-slate-700 px-3 py-2 rounded border border-slate-200 dark:border-slate-600 font-mono break-all overflow-wrap-anywhere'>
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
                      <div className='flex justify-center'>
                        <Image
                          src={expense.qrImage || "/placeholder.svg"}
                          alt='Payment QR Code'
                          width={192}
                          height={192}
                          className='w-48 h-48 max-w-full object-contain rounded-lg border border-slate-200 dark:border-slate-600 bg-white cursor-pointer hover:opacity-80 transition-opacity'
                          onClick={() => setShowImageModal(true)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && onDelete && (
        <ConfirmDeleteModal
          title='Delete Expense'
          message={`Are you sure you want to delete "${expense.description}"? This action cannot be undone.`}
          onConfirm={() => {
            onDelete();
            setShowDeleteConfirm(false);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText='Delete'
          cancelText='Cancel'
        />
      )}

      {showImageModal && expense.qrImage && (
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
              src={expense.qrImage}
              alt='QR Code - Full View'
              width={800}
              height={800}
              className='max-w-full max-h-full object-contain rounded-lg'
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseDetailModal;
