"use client";
import { Group } from "@/src/shared/types";
import { ArrowLeft, Plus, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { GROUPS } from "../Dashboard/dummdata";
import CreateTripModal from "../../shared/Modal/CreateTripModal";
import TripsListComponent from "./TripsList";

interface IGroupComponent {
  param: string;
}
const GroupComponent = ({ param }: IGroupComponent) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const router = useRouter();
  useEffect(() => {
    const savedGroups = GROUPS;
    if (savedGroups) {
      const groups = savedGroups;
      const foundGroup = groups.find((g: Group) => g.id === param);
      if (foundGroup) {
        setGroup(foundGroup);
      }
    }
  }, [param]);
  const copyCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveGroup = () => {
    console.log("LEAVE");
  };
  const handleUpdateGroup = () => {
    console.log("HANDLE");
  };
  if (!group) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/30 flex items-center justify-center p-4'>
        <div className='text-center bg-white rounded-2xl p-8 shadow-xl border border-slate-200 max-w-md'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-xl font-bold text-slate-900 mb-2'>
            Group Not Found
          </h2>
          <p className='text-slate-600 mb-6'>
            This group doesnt exist or has been removed.
          </p>
          <button
            onClick={handleLeaveGroup}
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
          onClick={() => router.push("/dashboard")}
          className='mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium'
        >
          <ArrowLeft className='w-5 h-5' />
          Back to Groups
        </button>

        <div className='mb-8 bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200'>
          <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6'>
            <div className='flex-1'>
              <h1 className='text-3xl md:text-4xl font-bold text-slate-900 mb-2 text-balance'>
                {group.name}
              </h1>
              <div className='flex items-center gap-2 flex-wrap'>
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
            </div>
          </div>

          <button
            onClick={() => setShowCreateTripModal(true)}
            className='w-full px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          >
            <Plus className='w-6 h-6' />
            Create New Trip
          </button>

          <div className='grid grid-cols-3 gap-3 mt-4'>
            <button
              onClick={() => router.push(`/group/${group.id}/members`)}
              className='px-4 py-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all font-medium flex flex-col items-center gap-2 text-sm shadow-md hover:shadow-lg border border-slate-200 group'
            >
              <span className='text-3xl group-hover:scale-110 transition-transform'>
                👥
              </span>
              <span className='text-slate-700 font-semibold'>Members</span>
              <span className='text-xs font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full min-w-[2rem]'>
                {group.members?.length || 0}
              </span>
            </button>
            <button
              onClick={() => router.push(`/group/${group.id}/expenses`)}
              className='px-4 py-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200 transition-all font-medium flex flex-col items-center gap-2 text-sm shadow-md hover:shadow-lg border border-green-200 group'
            >
              <span className='text-3xl group-hover:scale-110 transition-transform'>
                💰
              </span>
              <span className='text-green-700 font-semibold'>Expenses</span>
            </button>
            <button
              onClick={handleLeaveGroup}
              className='px-4 py-5 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 hover:from-red-100 hover:to-rose-200 transition-all font-medium flex flex-col items-center gap-2 text-sm shadow-md hover:shadow-lg border border-red-200 group'
            >
              <span className='text-3xl group-hover:scale-110 transition-transform'>
                🚪
              </span>
              <span className='text-red-600 font-semibold'>Leave</span>
            </button>
          </div>
        </div>

        <div>
          <h2 className='text-2xl font-bold text-slate-900 mb-4 px-1'>
            Your Trips
          </h2>
          {/* TODO: */}
          <TripsListComponent group={group} onUpdateGroup={handleUpdateGroup} />
        </div>
      </div>

      {showCreateTripModal && (
        <CreateTripModal onClose={() => setShowCreateTripModal(false)} />
      )}
    </main>
  );
};

export default GroupComponent;
