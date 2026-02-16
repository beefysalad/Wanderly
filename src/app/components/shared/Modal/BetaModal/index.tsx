import { X, Sparkles } from "lucide-react";
import React from "react";

interface IBetaModalProps {
  onClose: () => void;
}

const BetaModal = ({ onClose }: IBetaModalProps) => {
  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200'>
      <div className='bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 max-w-md w-full p-6 animate-in zoom-in-95 duration-200'>
        <div className='flex items-start gap-4 mb-4'>
          <div className='flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center'>
            <Sparkles className='w-6 h-6 text-purple-400' />
          </div>
          <div className='flex-1 min-w-0'>
            <h2 className='text-xl font-bold text-white mb-2'>Beta Feature</h2>
            <p className='text-slate-400 text-sm leading-relaxed'>
              This budget feature is currently in beta. You might experience
              some unexpected behavior. We appreciate your feedback!
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-slate-500 hover:text-slate-300 transition-colors p-1 hover:bg-white/5 rounded-lg'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <button
          onClick={onClose}
          className='w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 active:scale-95'
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default BetaModal;
