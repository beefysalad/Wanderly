"use client";
import { ArrowLeft, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import TripsListComponent from "../Group/TripsList";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useGuest } from "@/src/hooks/useGuest";

interface IGuestGroupComponent {
  groupId: string;
}
const GuestGroupComponent = ({ groupId }: IGuestGroupComponent) => {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { data: group, isLoading, error } = useGroupAsGuest(groupId);
  const guestSession = useGuest();

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
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/30 flex items-center justify-center p-4'>
        <div className='text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8'>
          <div className='w-16 h-16 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600 font-medium'>Loading group...</p>
        </div>
      </main>
    );
  }

  if (!group || error) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/30 flex items-center justify-center p-4'>
        <div className='text-center bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200 max-w-md'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-xl font-bold text-slate-900 mb-2'>
            Group Not Found
          </h2>
          <p className='text-slate-600 mb-6'>
            This group doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={goBack}
            className='px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/30 pb-20'>
      <div className='max-w-4xl mx-auto px-4 py-6'>
        <button
          onClick={goBack}
          className='mb-6 px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900 hover:bg-white/60 backdrop-blur-sm'
        >
          <ArrowLeft className='w-5 h-5' />
          Back to Home
        </button>

        <div className='mb-8 bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200'>
          <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6'>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-3'>
                <span className='px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold border border-amber-200'>
                  Viewing as Guest: {guestSession?.guestName || "Guest"}
                </span>
              </div>
              <h1 className='text-3xl md:text-4xl font-bold text-slate-900 mb-2 text-balance'>
                {group.name}
              </h1>
              <div className='flex items-center gap-2 flex-wrap mb-2'>
                <span className='text-sm text-slate-600'>Group Code:</span>
                <code className='px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg font-mono font-bold text-amber-600 text-lg'>
                  {group.code}
                </code>
                <button
                  onClick={copyCode}
                  className='px-3 py-1 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium flex items-center gap-1'
                >
                  <Share2 className='w-3 h-3' />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              {group.createdBy && (
                <p className='text-xs text-slate-500 flex items-center gap-1.5'>
                  <span>Group creator {group.createdBy}</span>
                </p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-2 mt-4'>
            <button
              onClick={() => router.push(`/guest/group/${group.id}/members`)}
              className='px-4 py-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all font-medium flex flex-col items-center gap-2 text-sm shadow-md hover:shadow-lg border border-slate-200 group'
            >
              <span className='text-3xl group-hover:scale-110 transition-transform'>
                👥
              </span>
              <span className='text-slate-700 font-semibold'>View Members</span>
            </button>
          </div>
        </div>

        <div className=' p-6 sm:p-8 '>
          <h2 className='text-2xl font-bold text-slate-900 mb-6'>Trips</h2>
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
