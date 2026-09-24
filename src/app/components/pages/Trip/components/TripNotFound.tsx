import { useRouter } from "next/navigation";

interface ITripNotFoundProps {
  groupId: string;
}

export const TripNotFound = ({ groupId }: ITripNotFoundProps) => {
  const router = useRouter();

  return (
    <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
      <div className='text-center bg-slate-900/60 rounded-2xl border border-white/10 p-10 max-w-md'>
        <div className='w-14 h-14 bg-red-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-500/20'>
          <span className='text-3xl'>😞</span>
        </div>
        <h2 className='text-xl font-semibold text-white mb-2'>
          Trip Not Found
        </h2>
        <p className='text-slate-400 mb-6'>
          This trip doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={() => router.push(`/group/${groupId}`)}
          className='px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10 transition-colors text-sm'
        >
          Go Back to Group
        </button>
      </div>
    </main>
  );
};
