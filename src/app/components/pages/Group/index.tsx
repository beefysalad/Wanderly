"use client";
import {
  ArrowLeft,
  Plus,
  Share2,
  UserPlus,
  Users,
  Trash2,
  LogOut,
  Settings,
  MoreVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import EditGroupModal from "../../shared/Modal/EditGroupModal";
import DashboardLayoutHeader from "../../shared/DashboardLayoutHeader";
import TripsListComponent from "./TripsList";
import { useGroup, useLeaveGroup, useDeleteGroup } from "@/src/hooks/useGroups";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import NavigationLoader from "../../shared/NavigationLoader";
import { useNavigationLoading } from "@/src/hooks/useNavigationLoading";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import { toast } from "sonner";

interface IGroupComponent {
  param: string;
}

const GroupComponent = ({ param }: IGroupComponent) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const router = useRouter();
  const { data: groupData, isLoading, error } = useGroup(param);
  const group = groupData?.group || null;
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();
  const { user } = useCurrentUser();
  const { isNavigating, withNavigation } = useNavigationLoading();

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(param);

  const isCreator = group && user?.email && group.createdByEmail === user.email;

  const copyCode = async () => {
    if (!group) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(group.code);
        setCopied(true);
        toast.success("Group code copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = group.code;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand("copy");
          if (successful) {
            setCopied(true);
            toast.success("Group code copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
          } else {
            console.error("Failed to copy using fallback method");
            toast.error("Failed to copy group code");
          }
        } catch (err) {
          console.error("Fallback copy failed:", err);
          toast.error("Failed to copy group code");
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      toast.error("Failed to copy group code");
    }
  };

  const copyInviteLink = async () => {
    if (!group) return;

    const inviteLink = `${window.location.origin}/invite/${group.code}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteLink);
        toast.success("Invite link copied!", {
          description: "Send it to your friend to join the group.",
        });
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = inviteLink;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand("copy");
          if (successful) {
            toast.success("Invite link copied!", {
              description: "Send it to your friend to join the group.",
            });
          } else {
            console.error("Failed to copy using fallback method");
            toast.error("Failed to copy invite link");
          }
        } catch (err) {
          console.error("Fallback copy failed:", err);
          toast.error("Failed to copy invite link");
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error("Failed to copy invite link:", err);
      toast.error("Failed to copy invite link");
    }
  };

  const goBack = () => {
    router.push("/groups");
  };

  const handleLeaveGroup = async () => {
    if (!group) return;
    try {
      await withNavigation(async () => {
        await leaveGroup.mutateAsync(group.id);
        setShowLeaveModal(false);
        router.push("/groups");
      });
    } catch (error) {
      console.error("Failed to leave group:", error);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    try {
      await withNavigation(async () => {
        await deleteGroup.mutateAsync(group.id);
        setShowDeleteModal(false);
        router.push("/groups");
      });
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
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
        <div className='text-center bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-white/5 p-16 max-w-md'>
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
            className='px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl'
          >
            Go to Groups
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-slate-950 pb-24 relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-3xl'></div>
      </div>

      <div className='max-w-4xl mx-auto px-4 py-6 relative z-10'>
        <DashboardLayoutHeader
          showBack={true}
          onBack={goBack}
          rightContent={
            <div className='relative'>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className='p-2 rounded-xl hover:bg-white/5 transition-colors text-slate-400 hover:text-white'
              >
                <MoreVertical className='w-5 h-5' />
              </button>

              {menuOpen && (
                <>
                  <div
                    className='fixed inset-0 z-40'
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className='absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden z-50'>
                    <button
                      onClick={() => {
                        copyInviteLink();
                        setMenuOpen(false);
                      }}
                      className='w-full px-4 py-3 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2'
                    >
                      <UserPlus className='w-4 h-4' />
                      Invite Members
                    </button>
                    {isCreator && (
                      <button
                        onClick={() => {
                          setShowEditModal(true);
                          setMenuOpen(false);
                        }}
                        className='w-full px-4 py-3 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 border-t border-white/5'
                      >
                        <Settings className='w-4 h-4' />
                        Group Settings
                      </button>
                    )}
                    {isCreator ? (
                      <button
                        onClick={() => {
                          setShowDeleteModal(true);
                          setMenuOpen(false);
                        }}
                        className='w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors border-t border-white/5'
                      >
                        <Trash2 className='w-4 h-4' />
                        Delete Group
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowLeaveModal(true);
                          setMenuOpen(false);
                        }}
                        className='w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors border-t border-white/5'
                      >
                        <LogOut className='w-4 h-4' />
                        Leave Group
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          }
        />
        {/* Group Info */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-white mb-2 break-words text-center'>
            {group.name}
          </h1>
          <div className='flex items-center gap-3 text-slate-400 mb-6 justify-center'>
            <div className='flex items-center gap-2'>
              <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse'></span>
              <span className='text-sm font-medium'>Active Group</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className='grid grid-cols-2 gap-3'>
            <button
              onClick={() => router.push(`/group/${group.id}/members`)}
              className='p-4 rounded-2xl bg-slate-800/20 hover:bg-slate-800/40 border border-white/5 backdrop-blur-xl transition-all text-left group'
            >
              <div className='flex items-center justify-between mb-2'>
                <div className='p-2 rounded-xl bg-blue-500/10 text-blue-400'>
                  <Users className='w-5 h-5' />
                </div>
                <ArrowLeft className='w-4 h-4 text-slate-500 rotate-180 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1' />
              </div>
              <div className='text-2xl font-bold text-white mb-0.5'>
                {group.memberEmails?.length || 0}
              </div>
              <div className='text-xs text-slate-400 font-medium'>Members</div>
            </button>

            <button
              onClick={copyCode}
              className='p-4 rounded-2xl bg-slate-800/20 hover:bg-slate-800/40 border border-white/5 backdrop-blur-xl transition-all text-left'
            >
              <div className='flex items-center justify-between mb-2'>
                <div className='p-2 rounded-xl bg-purple-500/10 text-purple-400'>
                  <Share2 className='w-5 h-5' />
                </div>
                {copied && (
                  <span className='text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg'>
                    Copied!
                  </span>
                )}
              </div>
              <div className='text-2xl font-bold text-white mb-0.5 tracking-wider'>
                {group.code}
              </div>
              <div className='text-xs text-slate-400 font-medium'>
                Group Code (Click to copy)
              </div>
            </button>
          </div>
        </div>
        {/* Trips Section */}
        <div>
          <div className='flex items-center justify-between mb-4 px-1'>
            <h2 className='text-xl font-bold text-white'>Trips</h2>
          </div>

          <TripsListComponent group={group} groupId={group.id} />
        </div>
        {/* Floating Action Buttons */}
        <div className='fixed bottom-6 right-6 z-50 flex flex-col gap-3'>
          <button
            onClick={() => router.push(`/group/${group.id}/trips/create`)}
            className='group flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-full shadow-lg shadow-orange-500/30 transition-all hover:scale-110 active:scale-95'
            title='Create New Trip'
          >
            <Plus className='w-7 h-7 transition-transform group-hover:rotate-90' />
            <span className='sr-only'>Create Trip</span>
          </button>
        </div>{" "}
      </div>

      {showEditModal && group && (
        <EditGroupModal group={group} onClose={() => setShowEditModal(false)} />
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

      {isNavigating && <NavigationLoader message='Redirecting...' />}
    </main>
  );
};

export default GroupComponent;
