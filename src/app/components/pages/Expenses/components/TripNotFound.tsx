import { useRouter } from "next/navigation";

interface ITripNotFoundProps {
  isEmbedded: boolean;
  groupId: string;
  tripId: string;
}

export const TripNotFound = ({ isEmbedded, groupId, tripId }: ITripNotFoundProps) => {
  const router = useRouter();

  if (isEmbedded) {
    return (
      <div className='text-center py-10'>
        <p className='text-slate-400'>Trip not found.</p>
      </div>
    );
  }
  return (
    <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
      <div className='text-center bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-xl border border-white/5 p-8 max-w-md'>
        <div className='w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4'>
          <span className='text-3xl'>😞</span>
        </div>
        <h2 className='text-xl font-bold text-white mb-2'>Trip Not Found</h2>
        <p className='text-slate-400 mb-6'>
          This trip doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={() => router.push(`/group/${groupId}/trip/${tripId}`)}
          className='px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-orange-500/20'
        >
          Go Back to Trip
        </button>
      </div>
    </main>
  );
};
