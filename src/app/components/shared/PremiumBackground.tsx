import React from 'react';

interface PremiumBackgroundProps {
  variant?: 'default' | 'orange' | 'red';
  className?: string;
}

const PremiumBackground: React.FC<PremiumBackgroundProps> = ({ 
  variant = 'default',
  className = ''
}) => {
  // Shared color configurations based on variants
  const variants = {
    default: {
      blob1: 'bg-purple-600/10',
      blob2: 'bg-emerald-500/10',
      blob3: 'bg-blue-500/5',
    },
    orange: {
      blob1: 'bg-orange-600/10',
      blob2: 'bg-emerald-500/10',
      blob3: 'bg-blue-500/5',
    },
    red: {
      blob1: 'bg-red-600/5',
      blob2: 'bg-slate-800/5', // placeholder for red variant
      blob3: 'bg-slate-900/5',
    }
  };

  const colors = variants[variant] || variants.default;

  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden ${className}`}>
      <div className={`absolute top-[-10%] left-[-10%] w-[70%] h-[70%] ${colors.blob1} rounded-full blur-[120px] animate-pulse opacity-50`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] ${colors.blob2} rounded-full blur-[120px] animate-pulse opacity-50`} style={{ animationDelay: '2s' }} />
      <div className={`absolute top-[20%] right-[10%] w-[40%] h-[40%] ${colors.blob3} rounded-full blur-[100px] opacity-30`} />
    </div>
  );
};

export default PremiumBackground;
