"use client";
import { ArrowLeft, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import TripsListComponent from "../Group/TripsList";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useGuest } from "@/src/hooks/useGuest";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";

interface IGuestGroupComponent {
  groupId: string;
}
const GuestGroupComponent = ({ groupId }: IGuestGroupComponent) => {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { data: group, isLoading, error } = useGroupAsGuest(groupId);
  const guestSession = useGuest();

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(groupId);

  const copyCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const goBack = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-400 font-medium'>Loading group...</p>
        </div>
      </main>
    );
  }

  if (!group || error) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-16 max-w-md'>
          <div className='w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6'>
            <span className='text-4xl'>😞</span>
          </div>
          <h2 className='text-2xl font-bold text-white mb-3'>
            Group Not Found
          </h2>
          <p className='text-slate-400 mb-8'>
            This group doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={goBack}
            className='px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-full transition-all font-bold shadow-lg shadow-amber-500/20 hover:scale-105'
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-slate-950 pb-20 relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px]'></div>
      </div>

      <div className='max-w-4xl mx-auto px-4 py-6 relative z-10'>
        <button
          onClick={goBack}
          className='mb-8 p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors inline-flex items-center gap-2 text-slate-400 hover:text-white group'
        >
          <ArrowLeft className='w-5 h-5 transition-transform group-hover:-translate-x-1' />
          <span className='font-medium'>Back to Home</span>
        </button>

        <div className='mb-8'>
          <div className='flex items-center gap-2 mb-4'>
            <span className='px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-bold border border-amber-500/20'>
              VIEWING AS GUEST:{" "}
              {guestSession?.guestName?.toUpperCase() || "GUEST"}
            </span>
          </div>
          <h1 className='text-4xl font-bold text-white mb-4 break-words'>
            {group.name}
          </h1>

          <div className='flex items-center gap-3 flex-wrap mb-8'>
            <div className='px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl flex items-center gap-3'>
              <span className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
                Code
              </span>
              <code className='font-mono font-bold text-amber-400 text-lg'>
                {group.code}
              </code>
            </div>
            <button
              onClick={copyCode}
              className='px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl transition-all font-medium flex items-center gap-2 active:scale-95'
            >
              <Share2 className='w-4 h-4' />
              <span>{copied ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <button
              onClick={() => router.push(`/guest/group/${group.id}/members`)}
              className='p-6 rounded-3xl bg-slate-900/50 hover:bg-slate-800/50 border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all text-left flex items-center justify-between group'
            >
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400'>
                  <span className='text-2xl group-hover:scale-110 transition-transform'>
                    👥
                  </span>
                </div>
                <div>
                  <div className='text-lg font-bold text-white'>
                    Group Members
                  </div>
                  <div className='text-xs text-slate-400 font-medium'>
                    View contributors
                  </div>
                </div>
              </div>
              <ArrowLeft className='w-4 h-4 text-slate-500 rotate-180 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1' />
            </button>
          </div>
        </div>

        <div className='mt-12'>
          <div className='flex items-center justify-between mb-6 px-1'>
            <h2 className='text-2xl font-bold text-white'>Trips</h2>
            <div className='h-px flex-1 bg-white/5 ml-6'></div>
          </div>
          <TripsListComponent
            trips={group.trips || []}
            groupId={group.id}
            readOnly={true}
          />
        </div>
      </div>
    </main>
  );
};

export default GuestGroupComponent;
