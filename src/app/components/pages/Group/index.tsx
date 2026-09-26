"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useDeleteGroup, useGroup, useLeaveGroup } from "@/src/hooks/useGroups";
import { useNavigationLoading } from "@/src/hooks/useNavigationLoading";
import { useNotifications } from "@/src/hooks/useNotifications";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import { AppShell } from "../../shared/AppShell/AppShell";
import LoadingState from "../../shared/LoadingState";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import EditGroupModal from "../../shared/Modal/EditGroupModal";
import NavigationLoader from "../../shared/NavigationLoader";
import { PILL } from "../../shared/Pills";
import { upcomingTrips, allTrips } from "../../shared/tripDates";
import { GroupActivity } from "./GroupActivity";
import { GroupHero } from "./GroupHero";
import { GroupMenu } from "./GroupMenu";
import { GroupTrips } from "./GroupTrips";

interface IGroupComponent {
  param: string;
}

const GroupComponent = ({ param }: IGroupComponent) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const router = useRouter();
  const { data: groupData, isLoading, error } = useGroup(param);
  const { data: notificationsData } = useNotifications({ limit: 80 });
  const group = groupData?.group || null;
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();
  const { user } = useCurrentUser();
  const { isNavigating, withNavigation } = useNavigationLoading();
  const today = useMemo(() => new Date(), []);

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(param);

  const isOwner = !!(group && user?.email && group.createdByEmail === user.email);

  const copyCode = async () => {
    if (!group) return;
    if (await copyToClipboard(group.code)) toast.success("Group code copied to clipboard!");
    else toast.error("Failed to copy group code");
  };

  const copyInviteLink = async () => {
    if (!group) return;
    const link = `${window.location.origin}/invite/${group.code}`;
    if (await copyToClipboard(link)) {
      toast.success("Invite link copied!", { description: "Send it to your friend to join the group." });
    } else {
      toast.error("Failed to copy invite link");
    }
  };

  const handleLeaveGroup = async () => {
    if (!group) return;
    try {
      await withNavigation(async () => {
        await leaveGroup.mutateAsync(group.id);
        setShowLeaveModal(false);
        router.push("/groups");
      });
    } catch (err) {
      console.error("Failed to leave group:", err);
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
    } catch (err) {
      console.error("Failed to delete group:", err);
    }
  };

  const back = { href: "/groups", crumb: "Groups" };

  if (isLoading) {
    return (
      <AppShell level='detail' back={back}>
        <LoadingState className='py-24' />
      </AppShell>
    );
  }

  if (!group || error) {
    return (
      <AppShell level='detail' back={back}>
        <div className='mx-auto max-w-md rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-10 text-center'>
          <h2 className='mb-2 text-xl font-bold'>Group not found</h2>
          <p className='mb-6 text-[#94a3b8]'>This group doesn&apos;t exist or has been removed.</p>
          <button type='button' onClick={() => router.push("/groups")} className={PILL.ghost}>
            Go to Groups
          </button>
        </div>
      </AppShell>
    );
  }

  const trips = group.trips ?? [];
  const upcoming = upcomingTrips(allTrips([group]), today).length;
  const recentActivity = (notificationsData?.notifications || [])
    .filter((notification) => notification.relatedGroupId === group.id)
    .slice(0, 5);

  return (
    <AppShell level='detail' back={{ ...back, crumb: "Groups" }}>
      <div className='flex flex-col gap-6'>
        <GroupHero
          group={group}
          upcomingCount={upcoming}
          membersHref={`/group/${group.id}/members`}
          onCopyCode={copyCode}
          onInvite={copyInviteLink}
          menu={
            <GroupMenu
              isOwner={isOwner}
              onSettings={() => setShowEditModal(true)}
              onDelete={() => setShowDeleteModal(true)}
              onLeave={() => setShowLeaveModal(true)}
            />
          }
        />

        <div className='flex flex-wrap items-start gap-6'>
          <GroupTrips
            trips={trips}
            today={today}
            tripHref={(tripId) => `/group/${group.id}/trip/${tripId}`}
            newTripHref={`/group/${group.id}/trips/create`}
          />
          <GroupActivity notifications={recentActivity} />
        </div>
      </div>

      {showEditModal ? <EditGroupModal group={group} onClose={() => setShowEditModal(false)} /> : null}

      {showLeaveModal ? (
        <ConfirmDeleteModal
          title='Leave Group'
          message={`Are you sure you want to leave "${group.name}"? You will lose access to all trips and expenses in this group.`}
          onConfirm={handleLeaveGroup}
          onCancel={() => setShowLeaveModal(false)}
          isDeleting={leaveGroup.isPending}
          confirmText='Leave Group'
          cancelText='Cancel'
        />
      ) : null}

      {showDeleteModal ? (
        <ConfirmDeleteModal
          title='Delete Group'
          message={`Are you sure you want to delete "${group.name}"? This will permanently delete the group, all trips, activities, and expenses. This action cannot be undone.`}
          onConfirm={handleDeleteGroup}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={deleteGroup.isPending}
          confirmText='Delete Group'
          cancelText='Cancel'
        />
      ) : null}

      {isNavigating ? <NavigationLoader message='Loading' /> : null}
    </AppShell>
  );
};

export default GroupComponent;
