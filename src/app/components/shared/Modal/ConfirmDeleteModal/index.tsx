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
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full p-6'>
        <div className='flex items-start gap-4 mb-6'>
          <div className='flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center'>
            <AlertTriangle className='w-5 h-5 text-red-600 dark:text-red-400' />
          </div>
          <div className='flex-1'>
            <h2 className='text-xl font-bold text-slate-900 dark:text-white mb-2'>
              {title}
            </h2>
            <p className='text-slate-600 dark:text-slate-300'>{message}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className='text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='flex gap-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isDeleting}
            className='flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {cancelText}
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={isDeleting}
            className='flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isDeleting ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;

