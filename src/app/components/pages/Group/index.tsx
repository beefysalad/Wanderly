"use client";
import { ArrowLeft, Plus, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import CreateTripModal from "../../shared/Modal/CreateTripModal";
import TripsListComponent from "./TripsList";
import { useGroup, useLeaveGroup, useDeleteGroup } from "@/src/hooks/useGroups";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";

interface IGroupComponent {
  param: string;
}
const GroupComponent = ({ param }: IGroupComponent) => {
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { data: groupData, isLoading, error } = useGroup(param);
  const group = groupData?.group || null;
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();
  const { user } = useCurrentUser();

  const isCreator = group && user?.email && group.createdByEmail === user.email;

  const copyCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const goBack = () => {
    router.push("/dashboard");
  };
  const handleLeaveGroup = async () => {
    if (!group) return;
    try {
      await leaveGroup.mutateAsync(group.id);
      setShowLeaveModal(false);
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to leave group:", error);
    }
  };
  const handleDeleteGroup = async () => {
    if (!group) return;
    try {
      await deleteGroup.mutateAsync(group.id);
      setShowDeleteModal(false);
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };
  const handleUpdateGroup = () => {
    console.log("HANDLE");
  };

  if (isLoading) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/30 flex items-center justify-center p-4'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4'></div>
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
            This group doesnt exist or has been removed.
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
          onClick={() => router.push("/dashboard")}
          className='mb-6 px-3 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 font-medium'
        >
          <ArrowLeft className='w-5 h-5' />
          Back to Groups
        </button>

        <div className='mb-8 bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200'>
          <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6'>
            <div className='flex-1'>
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

          <button
            onClick={() => setShowCreateTripModal(true)}
            className='w-full px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          >
            <Plus className='w-6 h-6' />
            Create New Trip
          </button>

          <div className='grid grid-cols-2 gap-2 mt-4'>
            <button
              onClick={() => router.push(`/group/${group.id}/members`)}
              className='px-4 py-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all font-medium flex flex-col items-center gap-2 text-sm shadow-md hover:shadow-lg border border-slate-200 group'
            >
              <span className='text-3xl group-hover:scale-110 transition-transform'>
                👥
              </span>
              <span className='text-slate-700 font-semibold'>
                Members{" "}
                <span className='text-xs font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full min-w-[2rem]'>
                  {group.memberEmails?.length || 0}
                </span>
              </span>
            </button>

            {isCreator ? (
              <button
                onClick={() => setShowDeleteModal(true)}
                className='px-4 py-5 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 hover:from-red-100 hover:to-rose-200 transition-all font-medium flex flex-col items-center gap-2 text-sm shadow-md hover:shadow-lg border border-red-200 group'
              >
                <span className='text-3xl group-hover:scale-110 transition-transform'>
                  🗑️
                </span>
                <span className='text-red-600 font-semibold'>Delete</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLeaveModal(true)}
                className='px-4 py-5 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 hover:from-red-100 hover:to-rose-200 transition-all font-medium flex flex-col items-center gap-2 text-sm shadow-md hover:shadow-lg border border-red-200 group'
              >
                <span className='text-3xl group-hover:scale-110 transition-transform'>
                  👋
                </span>
                <span className='text-red-600 font-semibold'>Leave</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className='text-2xl font-bold text-slate-900 mb-4 px-1'>
            Your Trips
          </h2>

          <TripsListComponent group={group} onUpdateGroup={handleUpdateGroup} />
        </div>
      </div>

      {showCreateTripModal && group && (
        <CreateTripModal
          groupId={group.id}
          onClose={() => setShowCreateTripModal(false)}
        />
      )}

      {showLeaveModal && group && (
        <ConfirmDeleteModal
          title='Leave Group'
          message={`Are you sure you want to leave "${group.name}"? You will lose access to all trips and expenses in this group.`}
          onConfirm={handleLeaveGroup}
          onCancel={() => setShowLeaveModal(false)}
          isDeleting={leaveGroup.isPending}
          confirmText='Leave Group'
          cancelText='Cancel'
        />
      )}

      {showDeleteModal && group && (
        <ConfirmDeleteModal
          title='Delete Group'
          message={`Are you sure you want to delete "${group.name}"? This will permanently delete the group, all trips, activities, and expenses. This action cannot be undone.`}
          onConfirm={handleDeleteGroup}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={deleteGroup.isPending}
          confirmText='Delete Group'
          cancelText='Cancel'
        />
      )}
    </main>
  );
};

export default GroupComponent;
