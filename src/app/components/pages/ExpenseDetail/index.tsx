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
import PremiumPageHeader from "../../shared/PremiumPageHeader";
import PremiumBackground from "../../shared/PremiumBackground";

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
      <PremiumBackground variant='orange' />

      <PremiumPageHeader 
        title='Transaction Details' 
        onBack={() => router.back()}
        actions={!readOnly && (onEdit || onDelete) && (
          <div className='relative'>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className='flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90'
            >
              <MoreVertical className='w-5 h-5' />
            </button>

            {showMenu && (
              <>
                <div className='fixed inset-0 z-40' onClick={() => setShowMenu(false)} />
                <div className='absolute right-0 top-full mt-3 w-52 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200'>
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit();
                        setShowMenu(false);
                      }}
                      className='w-full px-4 py-3.5 text-left text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors'
                    >
                      <Pencil className='w-4 h-4' />
                      Edit Transaction
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowMenu(false);
                      }}
                      className='w-full px-4 py-3.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-white/5'
                    >
                      <Trash2 className='w-4 h-4' />
                      Delete Transaction
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      />

      <div className='max-w-xl mx-auto px-5 relative z-10'>
        {/* The "Hero" Section */}
        <div className='pt-8 pb-10 flex flex-col items-center'>
          <div className='relative group mb-6'>
            <div className='absolute inset-0 bg-orange-500/20 blur-2xl rounded-full group-hover:bg-orange-500/30 transition-all duration-500' />
            <div className='relative w-20 h-20 rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-4xl shadow-2xl transition-transform duration-500 group-hover:scale-110 group-active:scale-95'>
              {expense.category ? categoryEmojis[expense.category] || "📌" : "📌"}
            </div>
            <div className='absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center shadow-lg'>
              <CheckCircle2 className='w-4 h-4 text-emerald-950' />
            </div>
          </div>

          <div className='text-center space-y-2 max-w-xs mx-auto mb-8'>
            <h1 className='text-2xl md:text-3xl font-black text-white leading-tight tracking-tight px-2'>
              {expense.description}
            </h1>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-wider'>
              <Calendar className='w-3 h-3' />
              {new Date(expense.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>

          <div className='relative flex flex-col items-center group'>
            <div className='flex items-baseline gap-1'>
               <span className='text-2xl font-black text-slate-600 -translate-y-4'>₱</span>
               <span className='text-6xl md:text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]'>
                 {expense.amount.toFixed(2)}
               </span>
            </div>
            <div className='mt-2 flex items-center gap-2'>
              <span className='px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest'>
                ₱{perPersonAmount.toFixed(2)} / pax
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid - The "Glass Card" */}
        <div className='space-y-4'>
           {/* Section: Split Details */}
           <div className='bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-6 shadow-2xl'>
            <div className='flex items-center justify-between mb-6'>
              <div className='space-y-1'>
                <h3 className='text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]'>Split Details</h3>
                <p className='text-xs text-slate-400'>Shared with {splitCount} people</p>
              </div>
              <div className='flex -space-x-2'>
                {expense.splitWith?.slice(0, 4).map((member, i) => (
                  <div key={member} className='w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden relative' style={{ zIndex: 10 - i }}>
                    {getMemberAvatar(member) ? (
                      <Image src={getMemberAvatar(member)!} alt='m' fill className='object-cover' />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-[10px] font-bold text-white'>
                        {getMemberInitials(member)}
                      </div>
                    )}
                  </div>
                ))}
                {splitCount > 4 && (
                  <div className='w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white z-0'>
                    +{splitCount - 4}
                  </div>
                )}
              </div>
            </div>

            <div className='space-y-3'>
              {/* The Payer (Pinned/Special) */}
              <div className='flex items-center justify-between p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10'>
                <div className='flex items-center gap-4'>
                   <div className='w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500'>
                     <CheckCircle2 className='w-5 h-5' />
                   </div>
                   <div>
                     <p className='text-xs font-black text-orange-500 uppercase tracking-widest mb-0.5'>Payer</p>
                     <p className='text-sm font-bold text-white'>{getDisplayName(expense.paidBy)} {currentUser === expense.paidBy && "(You)"}</p>
                   </div>
                </div>
                <div className='text-right'>
                  <p className='text-[10px] text-slate-500 font-bold uppercase mb-0.5 tracking-tight'>Total Paid</p>
                  <p className='text-sm font-black text-white tabular-nums'>₱{expense.amount.toFixed(2)}</p>
                </div>
              </div>

              {/* Members List */}
              <div className='pt-2 space-y-2'>
                {expense.splitWith?.filter(m => m !== expense.paidBy).map((member) => {
                  const isCurrentUser = currentUser === member;
                  const hasPaid = paidMembers.includes(member);
                  const isPending = (expense.paymentStatusMap?.[member] === "pending" || expense.pendingPayments?.includes(member));
                  
                  return (
                    <div key={member} className='flex items-center justify-between p-3 pl-1 pr-4 group'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full border border-white/5 overflow-hidden relative'>
                          {getMemberAvatar(member) ? (
                            <Image src={getMemberAvatar(member)!} alt='av' fill className='object-cover' />
                          ) : (
                            <div className='w-full h-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white'>
                              {getMemberInitials(member)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className='text-sm font-bold text-slate-200'>
                            {getDisplayName(member)}
                            {isCurrentUser && <span className='text-slate-500 font-normal ml-1'> (You)</span>}
                          </p>
                          <p className='text-[10px] text-slate-500'>₱{perPersonAmount.toFixed(2)} share</p>
                        </div>
                      </div>

                      <div className='flex items-center gap-3'>
                        {hasPaid ? (
                          <div className='flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'>
                            <div className='w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' />
                            <span className='text-[9px] font-black uppercase tracking-wider'>Payment Confirmed</span>
                          </div>
                        ) : isPending ? (
                          <div className='flex flex-col items-end gap-2'>
                            <div className='flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500'>
                              <Clock className='w-3 h-3 animate-pulse' />
                              <span className='text-[9px] font-black uppercase tracking-wider'>Awaiting Approval</span>
                            </div>
                            {isPayer && onConfirmPayment && (
                              <div className='flex items-center gap-2'>
                                <button onClick={() => onConfirmPayment(member, "confirmed")} className='p-2 bg-emerald-500 text-emerald-950 rounded-xl hover:bg-emerald-400 active:scale-90 transition-all'>
                                  <CheckCircle2 className='w-4 h-4' />
                                </button>
                                <button onClick={() => onConfirmPayment(member, "rejected")} className='p-2 bg-red-500 text-red-950 rounded-xl hover:bg-red-400 active:scale-90 transition-all'>
                                  <X className='w-4 h-4' />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : isCurrentUser && onMarkPaid ? (
                           <button
                             onClick={() => onMarkPaid(member)}
                             className='px-4 py-2 bg-white text-slate-950 text-[10px] font-black uppercase tracking-tighter rounded-xl hover:bg-orange-400 active:scale-95 transition-all shadow-xl'
                           >
                             Pay Now
                           </button>
                        ) : (
                          <span className='text-[9px] font-black uppercase tracking-[0.1em] text-slate-600'>Pending Payment</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section: Payment Method (The "Card") */}
          {expense.paymentMethod && (
            <div className='bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl'>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-8'>
                  <div className='space-y-1'>
                    <h3 className='text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]'>Payment Info</h3>
                    <p className='text-xs text-slate-400'>How to send your share</p>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl border ${
                    expense.paymentMethod === 'gcash' ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' :
                    expense.paymentMethod === 'maya' ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400' :
                    'bg-slate-800/50 border-white/10 text-slate-300'
                  }`}>
                    <span className='text-xs font-black uppercase tracking-widest flex items-center gap-2'>
                       {expense.paymentMethod === 'gcash' && <div className='w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' />}
                       {expense.paymentMethod === 'maya' && <div className='w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' />}
                       {expense.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {expense.accountName && (
                      <div className='p-5 rounded-3xl bg-white/5 border border-white/5 group transition-all'>
                         <p className='text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5'>Recipient Name</p>
                         <p className='text-base font-bold text-white truncate'>{expense.accountName}</p>
                      </div>
                    )}
                    {(expense.bankName || expense.accountNumber) && (
                      <div 
                        className={`p-5 rounded-3xl border transition-all cursor-pointer relative group ${
                          copiedId === 'acc' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => expense.accountNumber && copyToClipboard(expense.accountNumber, 'acc')}
                      >
                         <p className='text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5'>
                           {expense.bankName || 'Account #'}
                         </p>
                         <div className='flex items-center justify-between'>
                            <p className='text-base font-mono font-bold text-white truncate'>{expense.accountNumber || '-'}</p>
                            {expense.accountNumber && (
                              copiedId === 'acc' ? <CheckCircle2 className='w-4 h-4 text-emerald-500' /> : <Copy className='w-4 h-4 text-slate-500 group-hover:text-white transition-colors' />
                            )}
                         </div>
                      </div>
                    )}
                  </div>

                  {expense.qrImage && (
                    <div className='mt-2 space-y-4'>
                       <button
                         onClick={() => setShowImageModal(true)}
                         className='w-full aspect-video md:aspect-[21/9] relative rounded-[2rem] overflow-hidden group shadow-2xl'
                       >
                         <Image src={expense.qrImage} alt='QR' fill className='object-cover group-hover:scale-105 transition-transform duration-700' />
                         <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                           <div className='bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-full flex items-center gap-3 text-white font-bold shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500'>
                             <Share2 className='w-5 h-5' />
                             Zoom QR Code
                           </div>
                         </div>
                       </button>
                       <button
                         onClick={downloadQRCode}
                         className='w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-widest transition-all border border-white/5 flex items-center justify-center gap-3 active:scale-[0.98]'
                       >
                         <Download className='w-4 h-4' />
                         Download Image
                       </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Linked Activity Footer */}
          {linkedActivity && (
             <div className='px-6 py-4 flex items-center justify-between text-slate-500 group cursor-pointer hover:bg-white/5 rounded-2xl transition-all' onClick={() => router.push(`/group/${expense.groupId}/trip/${expense.tripId}?tab=daily`)}>
               <div className='flex items-center gap-3'>
                 <div className='w-1 h-8 bg-blue-500/30 rounded-full' />
                 <div>
                   <p className='text-[9px] font-black uppercase tracking-widest'>Associated with</p>
                   <p className='text-xs font-bold text-slate-300'>{linkedActivity.title}</p>
                 </div>
               </div>
               <Link2 className='w-4 h-4 group-hover:text-blue-400 transition-colors' />
             </div>
          )}
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {showImageModal && expense.qrImage && (
        <div className='fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300' onClick={() => setShowImageModal(false)}>
          <div className='relative w-full max-w-lg aspect-[3/4]'>
            <button
              onClick={() => setShowImageModal(false)}
              className='absolute -top-16 right-0 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10'
            >
              <X className='w-6 h-6' />
            </button>
            <Image src={expense.qrImage} alt='QR' fill className='object-contain rounded-3xl shadow-2xl' onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteConfirm && onDelete && (
        <ConfirmDeleteModal
          title='Delete Transaction'
          message='Are you sure? This will permanently remove this expense from the group and trip records. This cannot be undone.'
          onConfirm={() => {
            onDelete();
            setShowDeleteConfirm(false);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText='Delete'
          cancelText='Cancel'
        />
      )}
    </div>
  );
};

export default ExpenseDetail;
