import { X, AlertTriangle } from "lucide-react";
import React from "react";

interface IConfirmDeleteModal {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDeleteModal = ({
  title,
  message,
  onConfirm,
  onCancel,
  isDeleting = false,
  confirmText = "Delete",
  cancelText = "Cancel",
}: IConfirmDeleteModal) => {
  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200'>
      <div className='bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 max-w-md w-full p-6 animate-in zoom-in-95 duration-200'>
        <div className='flex items-start gap-4 mb-6'>
          <div className='flex-shrink-0 w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center'>
            <AlertTriangle className='w-6 h-6 text-red-400' />
          </div>
          <div className='flex-1 min-w-0'>
            <h2 className='text-xl font-bold text-white mb-2'>{title}</h2>
            <p className='text-slate-400 text-sm leading-relaxed'>{message}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className='text-slate-500 hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1 hover:bg-white/5 rounded-lg'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='flex gap-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isDeleting}
            className='flex-1 px-4 py-2.5 text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-white/10 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {cancelText}
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={isDeleting}
            className='flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isDeleting ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
