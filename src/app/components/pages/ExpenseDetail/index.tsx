"use client";
import { Expense, Activity } from "@/src/shared/types";
import {
  CheckCircle2,
  Copy,
  Download,
  Pencil,
  Trash2,
  X,
  Link2,
  Calendar,
  Clock,
  ArrowLeft,
  MoreVertical,
  Receipt,
  AlertCircle,
  Share2,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import { useRouter } from "next/navigation";

interface IExpenseDetailProps {
  expense: Expense;
  members: string[];
  memberNames?: Record<string, string>; // email -> name mapping
  memberMetadata?: Record<
    string,
    { joinedAt: string; name?: string; imageUrl?: string }
  >; // email -> metadata with imageUrl
  activities?: Activity[]; // activities from the trip
  onMarkPaid?: (memberId: string) => void;
  onConfirmPayment?: (
    memberEmail: string,
    status: "confirmed" | "rejected",
  ) => void;
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

const ExpenseDetail = ({
  expense,
  members,
  memberNames,
  memberMetadata,
  activities = [],
  onDelete,
  onEdit,
  onMarkPaid,
  onConfirmPayment,
  currentUser,
  readOnly = false,
}: IExpenseDetailProps) => {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
    <div className='min-h-screen bg-slate-950 pb-24 relative overflow-x-hidden font-sans selection:bg-orange-500/30'>
      {/* Ambient Backlight */}
      <div className='fixed inset-0 z-0 pointer-events-none'>
        <div className='absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-slate-900 to-slate-950' />
        <div className='absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[100px] opacity-40'></div>
        <div className='absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[100px] opacity-40'></div>
      </div>

      {/* Header */}
      <div className='p-4 md:p-6 z-20 relative flex items-center justify-between'>
        <button
          onClick={() => router.back()}
          className='flex items-center gap-2 px-3 py-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all'
        >
          <ArrowLeft className='w-5 h-5' />
        </button>

        {!readOnly && (onEdit || onDelete) && (
          <div className='relative'>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className='p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors'
            >
              <MoreVertical className='w-5 h-5' />
            </button>

            {showMenu && (
              <div className='absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden z-50'>
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit();
                      setShowMenu(false);
                    }}
                    className='w-full px-4 py-3 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2'
                  >
                    <Pencil className='w-4 h-4' />
                    Edit Expense
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowMenu(false);
                    }}
                    className='w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors'
                  >
                    <Trash2 className='w-4 h-4' />
                    Delete Expense
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className='max-w-4xl mx-auto relative z-10'>
        <div className='px-5 pt-8 pb-12'>
          {/* Header / Hero */}
          <div className='flex flex-col items-center text-center space-y-4 mb-12 relative'>
            {/* Background Glow */}
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-500/10 rounded-full blur-[80px] pointer-events-none' />

            <div className='relative'>
              <div className='w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-4xl shadow-2xl shadow-black/30 mb-2 mx-auto ring-4 ring-slate-950'>
                {expense.category
                  ? categoryEmojis[expense.category] || "📌"
                  : "📌"}
              </div>
            </div>

            <div className='space-y-1 relative z-10'>
              <h1 className='text-3xl md:text-5xl font-black text-white px-4 leading-tight tracking-tight'>
                {expense.description}
              </h1>
              <div className='flex items-center justify-center gap-2 text-slate-400 font-medium text-sm md:text-base'>
                <Calendar className='w-4 h-4' />
                <span>
                  {new Date(expense.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className='my-8 relative group cursor-default z-10 scale-110'>
              <div className='flex items-baseline justify-center gap-1'>
                <span className='text-3xl font-bold text-slate-500 -translate-y-4'>
                  ₱
                </span>
                <span className='text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tighter drop-shadow-2xl'>
                  {expense.amount.toFixed(2)}
                </span>
              </div>
              <div className='text-orange-400 font-bold mt-2 bg-orange-500/10 px-6 py-2 rounded-full text-sm inline-block border border-orange-500/20 shadow-lg shadow-orange-500/10'>
                ₱{perPersonAmount.toFixed(2)} per person
              </div>
            </div>
          </div>

          {/* Content Cards */}
          <div className='space-y-6'>
            {/* Linked Activity */}
            {linkedActivity && (
              <div className='bg-slate-900/40 rounded-2xl p-4 flex items-center gap-4 border border-white/5 hover:border-blue-500/30 transition-colors cursor-default group'>
                <div className='w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform'>
                  <Link2 className='w-6 h-6' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs uppercase font-bold text-slate-500 tracking-wider mb-0.5'>
                    Linked Activity
                  </p>
                  <p className='text-white font-bold truncate'>
                    {linkedActivity.title}
                  </p>
                </div>
              </div>
            )}

            {/* Paid By Card */}
            <div className='bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 border border-white/5'>
              <h3 className='text-sm font-bold text-slate-500 uppercase tracking-widest mb-4'>
                Payer
              </h3>
              <div className='flex items-center gap-4'>
                <div className='relative'>
                  {getMemberAvatar(expense.paidBy) ? (
                    <div className='w-14 h-14 rounded-full border-2 border-slate-700 overflow-hidden'>
                      <Image
                        src={getMemberAvatar(expense.paidBy)!}
                        alt='Payer'
                        fill
                        className='object-cover'
                      />
                    </div>
                  ) : (
                    <div className='w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl border-2 border-slate-700'>
                      {getMemberInitials(expense.paidBy)}
                    </div>
                  )}
                  <div className='absolute -bottom-1 -right-1 bg-slate-800 p-1 rounded-full border border-slate-700'>
                    <div className='bg-emerald-500 w-4 h-4 rounded-full flex items-center justify-center'>
                      <CheckCircle2 className='w-3 h-3 text-emerald-900' />
                    </div>
                  </div>
                </div>
                <div>
                  <p className='text-lg font-bold text-white'>
                    {getDisplayName(expense.paidBy)}
                    {currentUser === expense.paidBy && (
                      <span className='text-slate-500 font-normal ml-2'>
                        (You)
                      </span>
                    )}
                  </p>
                  <p className='text-slate-400 text-sm'>Paid full amount</p>
                </div>
              </div>
            </div>

            {/* Split List */}
            <div className='bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 border border-white/5'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-sm font-bold text-slate-500 uppercase tracking-widest'>
                  Shared With{" "}
                  <span className='text-slate-600 ml-1'>({splitCount})</span>
                </h3>
                <div className='h-1 flex-1 mx-4 bg-slate-800 rounded-full overflow-hidden'>
                  <div
                    style={{
                      width: `${(paidMembers.length / (splitCount - 1 || 1)) * 100}%`,
                    }}
                    className='h-full bg-emerald-500 rounded-full transition-all duration-1000'
                  />
                </div>
              </div>

              <div className='space-y-3'>
                {expense.splitWith?.map((member) => {
                  if (member === expense.paidBy) return null; // Skip payer in list mostly, or show as 'Owner'

                  const isCurrentUser = currentUser === member;
                  const hasPaid = paidMembers.includes(member);
                  const paymentStatus = paymentStatusMap[member];
                  const isPending =
                    paymentStatus === "pending" ||
                    pendingPayments.includes(member);
                  const isRejected = paymentStatus === "rejected";

                  const showMarkAsPaid =
                    !readOnly &&
                    onMarkPaid &&
                    isCurrentUser &&
                    !hasPaid &&
                    !isPending;
                  const showConfirmButtons =
                    !readOnly && onConfirmPayment && isPayer && isPending;

                  return (
                    <div
                      key={member}
                      className='flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors'
                    >
                      <div className='flex items-center gap-3 min-w-0'>
                        {getMemberAvatar(member) ? (
                          <div className='w-10 h-10 rounded-full overflow-hidden flex-shrink-0'>
                            <Image
                              src={getMemberAvatar(member)!}
                              alt='Avatar'
                              fill
                              className='object-cover'
                            />
                          </div>
                        ) : (
                          <div className='w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0'>
                            {getMemberInitials(member)}
                          </div>
                        )}
                        <div className='min-w-0'>
                          <p className='font-bold text-slate-200 text-sm truncate'>
                            {getDisplayName(member)}
                            {isCurrentUser && " (You)"}
                          </p>
                          <p className='text-xs text-slate-500'>
                            ₱{perPersonAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Actions / Status */}
                      <div>
                        {hasPaid ? (
                          <span className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20'>
                            <CheckCircle2 className='w-3.5 h-3.5' />
                            Paid
                          </span>
                        ) : isPending ? (
                          <div className='flex flex-col items-end gap-2'>
                            <span className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/20'>
                              <Clock className='w-3.5 h-3.5' />
                              Pending
                            </span>
                            {showConfirmButtons && (
                              <div className='flex items-center gap-1'>
                                <button
                                  onClick={() =>
                                    onConfirmPayment(member, "confirmed")
                                  }
                                  className='p-1.5 bg-emerald-600 rounded-lg text-white hover:bg-emerald-500 transition-colors'
                                >
                                  <CheckCircle2 className='w-4 h-4' />
                                </button>
                                <button
                                  onClick={() =>
                                    onConfirmPayment(member, "rejected")
                                  }
                                  className='p-1.5 bg-red-600 rounded-lg text-white hover:bg-red-500 transition-colors'
                                >
                                  <X className='w-4 h-4' />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : isRejected ? (
                          <span className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider border border-red-500/20'>
                            <AlertCircle className='w-3.5 h-3.5' />
                            Rejected
                          </span>
                        ) : showMarkAsPaid ? (
                          <button
                            onClick={() => onMarkPaid(member)}
                            className='px-4 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20'
                          >
                            Pay ₱{perPersonAmount.toFixed(2)}
                          </button>
                        ) : (
                          <span className='px-3 py-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider'>
                            Unpaid
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details Grid - Payment Info */}
            {expense.paymentMethod && (
              <div className='grid grid-cols-1 gap-4'>
                <div className='bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 border border-white/5 space-y-6'>
                  <h3 className='text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2'>
                    <Receipt className='w-4 h-4' />
                    Payment Info
                  </h3>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='p-4 rounded-2xl bg-white/5 border border-white/5'>
                      <p className='text-xs text-slate-500 font-bold uppercase mb-1'>
                        Method
                      </p>
                      <p className='text-lg font-bold text-white capitalize flex items-center gap-2'>
                        {expense.paymentMethod === "gcash" && "🔵 GCash"}
                        {expense.paymentMethod === "maya" && "🟢 Maya"}
                        {expense.paymentMethod === "bank" && "🏦 Bank"}
                        {expense.paymentMethod === "cash" && "💵 Cash"}
                      </p>
                    </div>
                    {expense.accountNumber && (
                      <div
                        className='p-4 rounded-2xl bg-white/5 border border-white/5 relative group cursor-pointer'
                        onClick={() =>
                          copyToClipboard(expense.accountNumber!, "acc")
                        }
                      >
                        <p className='text-xs text-slate-500 font-bold uppercase mb-1'>
                          Account
                        </p>
                        <div className='flex items-center gap-2'>
                          <p className='text-lg font-mono font-bold text-white truncate'>
                            {expense.accountNumber}
                          </p>
                          {copiedId === "acc" ? (
                            <CheckCircle2 className='w-4 h-4 text-emerald-500' />
                          ) : (
                            <Copy className='w-4 h-4 text-slate-500' />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {expense.qrImage && (
                    <div className='mt-4'>
                      <button
                        onClick={() => setShowImageModal(true)}
                        className='w-full aspect-square relative rounded-2xl overflow-hidden border border-white/10 group'
                      >
                        <Image
                          src={expense.qrImage}
                          alt='QR Code'
                          fill
                          className='object-cover group-hover:scale-105 transition-transform duration-500'
                        />
                        <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                          <span className='text-white font-bold flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md'>
                            <Share2 className='w-4 h-4' />
                            View QR
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={downloadQRCode}
                        className='w-full mt-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm transition-colors flex items-center justify-center gap-2'
                      >
                        <Download className='w-4 h-4' />
                        Save QR Code
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full Screen Image Modal */}
        {showImageModal && expense.qrImage && (
          <div
            className='fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200'
            onClick={() => setShowImageModal(false)}
          >
            <div className='relative w-full max-w-lg aspect-[3/4]'>
              <button
                onClick={() => setShowImageModal(false)}
                className='absolute -top-12 right-0 p-2 text-white/50 hover:text-white'
              >
                <X className='w-8 h-8' />
              </button>
              <Image
                src={expense.qrImage}
                alt='QR Full'
                fill
                className='object-contain rounded-2xl shadow-2xl'
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteConfirm && onDelete && (
          <ConfirmDeleteModal
            title='Delete Expense'
            message='Are you sure? This will remove the expense for everyone.'
            onConfirm={() => {
              onDelete();
              setShowDeleteConfirm(false);
            }}
            onCancel={() => setShowDeleteConfirm(false)}
            confirmText='Delete it'
            cancelText='Keep it'
          />
        )}
      </div>
    </div>
  );
};

export default ExpenseDetail;
