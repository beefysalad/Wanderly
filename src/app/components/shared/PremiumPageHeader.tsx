import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface PremiumPageHeaderProps {
  title: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

const PremiumPageHeader: React.FC<PremiumPageHeaderProps> = ({ 
  title, 
  onBack, 
  actions,
  className = ''
}) => {
  const router = useRouter();
  
  return (
    <div className={`sticky top-0 p-4 md:p-6 z-50 relative flex items-center justify-between backdrop-blur-md bg-slate-950/20 ${className}`}>
      <button
        onClick={onBack || (() => router.back())}
        className='flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90'
      >
        <ArrowLeft className='w-5 h-5' />
      </button>

      <p className='text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-slate-900/50 px-4 py-1.5 rounded-full border border-white/5'>
        {title}
      </p>

      <div className='min-w-[40px] flex justify-end'>
        {actions || <div className='w-10' />}
      </div>
    </div>
  );
};

export default PremiumPageHeader;
