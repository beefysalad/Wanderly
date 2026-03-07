"use client";
import {
  ArrowLeft,
  Loader2,
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
import { useNotifications } from "@/src/hooks/useNotifications";
import NavigationLoader from "../../shared/NavigationLoader";
import { useNavigationLoading } from "@/src/hooks/useNavigationLoading";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import { toast } from "sonner";
import { getGroupColorClasses, getVibeInfo } from "@/lib/utils/groupColors";
import PremiumPageHeader from "../../shared/PremiumPageHeader";
import RecentActivityFeed from "../../shared/RecentActivityFeed";

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
  const { data: notificationsData } = useNotifications({ limit: 80 });
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
          <Loader2 className='mx-auto mb-3 h-8 w-8 animate-spin text-slate-400' />
          <p className='text-sm text-slate-400'>Loading group...</p>
        </div>
      </main>
    );
  }

  if (!group || error) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center bg-slate-900/60 rounded-2xl border border-white/10 p-10 max-w-md'>
          <div className='w-16 h-16 bg-red-500/15 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-500/30'>
            <span className='text-4xl'>😞</span>
          </div>
          <h2 className='text-xl font-semibold text-white mb-2'>
            Group Not Found
          </h2>
          <p className='text-slate-400 mb-6'>
            This group doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={goBack}
            className='px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10 transition-colors text-sm'
          >
            Go to Groups
          </button>
        </div>
      </main>
    );
  }

  const colors = getGroupColorClasses(group.colorScheme);
  const vibe = getVibeInfo(group.colorScheme);
  const recentGroupActivity = (notificationsData?.notifications || [])
    .filter((notification) => notification.relatedGroupId === group.id)
    .slice(0, 6);

  return (
    <main className='min-h-screen bg-slate-950 pb-24 font-sans'>

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
                <div className='absolute right-0 top-full mt-3 w-52 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50'>
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

      <div className='max-w-4xl mx-auto px-4 py-6'>
        <div className='mb-8 text-center bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8'>
          <div
            className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-white/10`}
          >
            {group.emoji || vibe.emoji}
          </div>
          <h1 className='text-3xl font-semibold text-white mb-2 break-words'>
            {group.name}
          </h1>
          <div className='flex items-center gap-3 text-slate-400 mb-6 justify-center h-6'>
            <div className='flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-white/10'>
              <span
                className={`w-2 h-2 rounded-full ${colors.bg}`}
              ></span>
              <span className='text-xs font-medium'>
                {vibe.name} Vibe
              </span>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <button
              onClick={() => router.push(`/group/${group.id}/members`)}
              className='p-4 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-white/10 transition-colors text-left group'
            >
              <div className='flex items-center justify-between mb-2'>
                <Users className='w-4 h-4 text-slate-400' />
                <ArrowLeft className='w-4 h-4 text-slate-500 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity' />
              </div>
              <div className='text-2xl font-semibold text-white mb-1'>
                {group.memberEmails?.length || 0}
              </div>
              <div className='text-xs text-slate-400'>
                Members
              </div>
            </button>

            <button
              onClick={copyCode}
              className='p-4 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-white/10 transition-colors text-left relative'
            >
              <div className='flex items-center justify-between mb-2'>
                <Share2 className='w-4 h-4 text-slate-400' />
                {copied && (
                  <span className='absolute top-4 right-4 text-[10px] font-medium text-emerald-300 bg-emerald-500/15 px-2 py-1 rounded-md border border-emerald-500/30'>
                    Copied!
                  </span>
                )}
              </div>
              <div className='text-2xl font-semibold text-white mb-1 tracking-tight'>
                {group.code}
              </div>
              <div className='text-xs text-slate-400'>
                Group Code
              </div>
            </button>
          </div>
        </div>

        <div className='grid gap-4 lg:grid-cols-[1.5fr_1fr]'>
          <div>
            <div className='flex items-center justify-between mb-4 px-1'>
              <h2 className='text-xl font-semibold text-white'>Trips</h2>
            </div>
            <TripsListComponent group={group} groupId={group.id} />
          </div>
          <RecentActivityFeed
            title='Recent Group Activity'
            notifications={recentGroupActivity}
            emptyText='No recent updates in this group yet.'
          />
        </div>

        <div className='fixed bottom-6 right-6 z-50 flex flex-col gap-3'>
          <button
            onClick={() => router.push(`/group/${group.id}/trips/create`)}
            className='group flex items-center justify-center w-14 h-14 bg-orange-500 hover:bg-orange-400 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95'
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
