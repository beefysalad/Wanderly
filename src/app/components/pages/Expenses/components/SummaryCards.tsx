interface IUnsettledSummaryProps {
  youOwe: number;
  youAreOwed: number;
}

export const UnsettledSummary = ({ youOwe, youAreOwed }: IUnsettledSummaryProps) => {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
      <div className='bg-gradient-to-br from-red-500/10 to-red-900/20 border border-red-500/20 rounded-3xl p-6 relative overflow-hidden group'>
        <div className='absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity'>
          <span className='text-6xl'>📤</span>
        </div>
        <p className='text-sm font-bold text-red-400 uppercase tracking-widest mb-1'>
          You Owe
        </p>

        <p className='text-3xl sm:text-4xl font-bold text-white tracking-tight'>
          ₱{youOwe.toFixed(2)}
        </p>
      </div>

      <div className='bg-gradient-to-br from-emerald-500/10 to-emerald-900/20 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group'>
        <div className='absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity'>
          <span className='text-6xl'>📥</span>
        </div>
        <p className='text-sm font-bold text-emerald-400 uppercase tracking-widest mb-1'>
          You&apos;re Owed
        </p>

        <p className='text-3xl sm:text-4xl font-bold text-white tracking-tight'>
          ₱{youAreOwed.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export const SettledSummary = ({ totalSettled }: { totalSettled: number }) => {
  return (
    <div className='bg-slate-800/40 border border-white/5 rounded-3xl p-6 flex items-center justify-between'>
      <div>
        <p className='text-sm font-medium text-slate-400 mb-1'>
          Total Settled Amount
        </p>
        <p className='text-3xl font-bold text-white tracking-tight'>
          ₱{totalSettled.toFixed(2)}
        </p>
      </div>
      <div className='w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center'>
        <span className='text-2xl'>✓</span>
      </div>
    </div>
  );
};
