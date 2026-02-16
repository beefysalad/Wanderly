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
import TripsListComponent from "./TripsList";
import { useGroup, useLeaveGroup, useDeleteGroup } from "@/src/hooks/useGroups";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import NavigationLoader from "../../shared/NavigationLoader";
import { useNavigationLoading } from "@/src/hooks/useNavigationLoading";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import { toast } from "sonner";
import { getGroupColorClasses, getVibeInfo } from "@/lib/utils/groupColors";
import PremiumPageHeader from "../../shared/PremiumPageHeader";

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
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden'>
        <div className='absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-orange-600/5 rounded-full blur-[120px] animate-pulse opacity-50' />
        <div className='text-center relative z-10'>
          <div className='w-16 h-16 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-400 font-medium'>Loading group...</p>
        </div>
      </main>
    );
  }

  if (!group || error) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden'>
        <div className='absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-red-600/5 rounded-full blur-[120px] animate-pulse opacity-50' />
        <div className='text-center bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/5 p-16 max-w-md relative z-10'>
          <div className='w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-lg'>
            <span className='text-4xl'>😞</span>
          </div>
          <h2 className='text-2xl font-bold text-white mb-3 tracking-tight'>
            Group Not Found
          </h2>
          <p className='text-slate-400 mb-8'>
            This group doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={goBack}
            className='px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-all font-bold tracking-tight'
          >
            Go to Groups
          </button>
        </div>
      </main>
    );
  }

  const colors = getGroupColorClasses(group.colorScheme);
  const vibe = getVibeInfo(group.colorScheme);

  return (
    <main className='min-h-screen bg-slate-950 pb-24 relative overflow-hidden selection:bg-orange-500/30 font-sans'>
      {/* Immersive Animated Background */}
      <div className='fixed inset-0 z-0 pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-orange-600/10 rounded-full blur-[120px] animate-pulse opacity-50' />
        <div className='absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse opacity-50' style={{ animationDelay: '2s' }} />
        <div className='absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px] opacity-30' />
      </div>

      <PremiumPageHeader 
        title='Group Details' 
        onBack={goBack}
        actions={
          <div className='relative'>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className='flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90'
            >
              <MoreVertical className='w-5 h-5' />
            </button>

            {menuOpen && (
              <>
                <div
                  className='fixed inset-0 z-40'
                  onClick={() => setMenuOpen(false)}
                />
                <div className='absolute right-0 top-full mt-3 w-52 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200'>
                  <button
                    onClick={() => {
                      copyInviteLink();
                      setMenuOpen(false);
                    }}
                    className='w-full px-4 py-3.5 text-left text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors'
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
                      className='w-full px-4 py-3.5 text-left text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors border-t border-white/5'
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
                      className='w-full px-4 py-3.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-white/5'
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
                      className='w-full px-4 py-3.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-white/5'
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

      <div className='max-w-4xl mx-auto px-4 py-6 relative z-10'>
        {/* Group Info */}
        <div className='mb-8 text-center'>
          <div
            className={`w-20 h-20 ${colors.bg} rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-black/40 border border-white/10`}
          >
            {group.emoji || vibe.emoji}
          </div>
          <h1 className='text-4xl font-black text-white mb-2 break-words'>
            {group.name}
          </h1>
          <div className='flex items-center gap-3 text-slate-400 mb-8 justify-center h-6'>
            <div className='flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5'>
              <span
                className={`w-2 h-2 rounded-full ${colors.bg} animate-pulse`}
              ></span>
              <span className='text-xs font-bold uppercase tracking-widest'>
                {vibe.name} Vibe
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className='grid grid-cols-2 gap-4'>
            <button
              onClick={() => router.push(`/group/${group.id}/members`)}
              className='p-6 rounded-2xl bg-slate-900/40 hover:bg-slate-900/60 border border-white/5 backdrop-blur-xl transition-all text-left group'
            >
              <div className='flex items-center justify-between mb-4'>
                <div
                  className={`p-3 rounded-xl ${colors.bg.replace("bg-", "bg-")}/10 ${colors.text}`}
                >
                  <Users className='w-6 h-6' />
                </div>
                <ArrowLeft className='w-4 h-4 text-slate-500 rotate-180 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1' />
              </div>
              <div className='text-3xl font-black text-white mb-1'>
                {group.memberEmails?.length || 0}
              </div>
              <div className='text-xs font-black uppercase text-slate-500 tracking-wider'>
                Members
              </div>
            </button>

            <button
              onClick={copyCode}
              className='p-6 rounded-2xl bg-slate-900/40 hover:bg-slate-900/60 border border-white/5 backdrop-blur-xl transition-all text-left relative'
            >
              <div className='flex items-center justify-between mb-4'>
                <div
                  className={`p-3 rounded-xl ${colors.bg}/10 ${colors.text}`}
                >
                  <Share2 className='w-6 h-6' />
                </div>
                {copied && (
                  <span className='absolute top-6 right-6 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20'>
                    Copied!
                  </span>
                )}
              </div>
              <div className='text-3xl font-black text-white mb-1 tracking-tighter'>
                {group.code}
              </div>
              <div className='text-xs font-black uppercase text-slate-500 tracking-wider'>
                Group Code
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
