import { auth } from "@/lib/firebase";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import type { Trip } from "@/src/shared/types/index";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
// CreateGroupModal import removed
import JoinGroupModal from "../../shared/Modal/JoinGroupModal";
import DashboardCTA from "./DashboardCTA";
import DashboardCalendar from "./DashboardCalendar";
import DashboardGroupCards from "./DashboardGroupCards";
// DashboardHeader replaced
import DashboardLayoutHeader from "../../shared/DashboardLayoutHeader";
import DashboardBottomNav from "./DashboardBottomNav";
import DashboardStatistics from "./DashboardStatistics";
import WhatsNewModal from "../../shared/Modal/WhatsNewModal";
import NotificationBell from "../../shared/NotificationBell";
import UserMenu from "../../shared/UserMenu";

import { useGroups } from "@/src/hooks/useGroups";
import { useSocket } from "@/src/hooks/useSocket";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import { CURRENT_WHATS_NEW_VERSION } from "../../../config/whats-new";

const DashboardComponent = () => {
  const router = useRouter();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);
  const { user } = useCurrentUser();
  const { data: groupsData, isLoading: loading } = useGroups();
  const allGroups = groupsData?.groups || [];
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Listen for group updates on dashboard (for all groups)
  useEffect(() => {
    if (!socket) return;

    const handleGroupUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    };

    const handleTripCreated = () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    };

    socket.on("group:updated", handleGroupUpdate);
    socket.on("trip:created", handleTripCreated);

    return () => {
      socket.off("group:updated", handleGroupUpdate);
      socket.off("trip:created", handleTripCreated);
    };
  }, [socket, queryClient]);

  // Check database for "seen" status
  useEffect(() => {
    if (!user) return;

    const checkWhatsNew = async () => {
      try {
        const res = await api.get("/sync");
        const dbUser = res.data.user;
        if (dbUser && dbUser.lastSeenWhatsNew !== CURRENT_WHATS_NEW_VERSION) {
          setShowWhatsNew(true);
        }
      } catch (err) {
        console.error("Failed to check WhatsNew status:", err);
        // Fallback to local storage if API fails, or just don't show it
      }
    };

    checkWhatsNew();
  }, [user]);

  const handleCloseWhatsNew = async () => {
    setShowWhatsNew(false);
    try {
      await api.patch("/user/profile", {
        lastSeenWhatsNew: CURRENT_WHATS_NEW_VERSION,
      });
    } catch (err) {
      console.error("Failed to update WhatsNew status:", err);
    }
  };

  // Sort groups by createdAt descending (most recent first)
  const sortedGroups = [...allGroups].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  // Limit to 6 groups for dashboard display
  const limitedGroups = sortedGroups.slice(0, 6);

  const handleLogout = async () => {
    await signOut(auth);
  };
  const handleNavigateToGroup = (groupId: string) => {
    router.push(`/group/${groupId}`);
  };

  const handleViewAllGroups = () => {
    router.push("/groups");
  };

  if (loading) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>
        <div className='text-center'>
          <div className='relative w-20 h-20 mx-auto mb-6'>
            <div className='absolute inset-0 border-4 border-slate-800 rounded-full'></div>
            <div className='absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin'></div>
          </div>
          <p className='text-slate-400 font-bold tracking-tight'>
            Loading your groups...
          </p>
        </div>
      </main>
    );
  }

  const getAllTripsWithGroups = (): Array<
    Trip & { groupName: string; groupColor: string }
  > => {
    const colors = [
      "bg-amber-500",
      "bg-orange-500",
      "bg-rose-500",
      "bg-pink-500",
      "bg-purple-500",
      "bg-indigo-500",
      "bg-blue-500",
      "bg-cyan-500",
      "bg-teal-500",
      "bg-emerald-500",
    ];

    const allTrips: Array<Trip & { groupName: string; groupColor: string }> =
      [];

    sortedGroups.forEach((group, index) => {
      const groupColor = colors[index % colors.length];
      group.trips?.forEach((trip) => {
        allTrips.push({
          ...trip,
          groupName: group.name,
          groupColor,
        });
      });
    });

    return allTrips;
  };
  const getTripsForDate = (date: Date) => {
    const allTrips = getAllTripsWithGroups();

    // Normalize the input date to midnight (remove time component)
    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    return allTrips.filter((trip) => {
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);

      // Normalize trip dates to midnight (remove time component)
      const normalizedStartDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      );
      const normalizedEndDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
      );

      return (
        normalizedDate >= normalizedStartDate &&
        normalizedDate <= normalizedEndDate
      );
    });
  };

  return (
    <main className='min-h-screen bg-slate-950 pb-36 md:pb-28 relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-3xl'></div>
      </div>

      <div className='max-w-4xl mx-auto px-4 py-4 md:py-6 relative z-10'>
        <DashboardLayoutHeader
          title='Wanderly'
          description={"Welcome back, " + user?.displayName}
          rightContent={
            <div className='flex items-center gap-2'>
              <UserMenu />
              <div className='flex-shrink-0'>
                <NotificationBell />
              </div>
            </div>
          }
        />

        <DashboardStatistics groups={sortedGroups} />

        <DashboardCTA setShowJoinModal={setShowJoinModal} />

        {sortedGroups.length > 0 && (
          <div className='mt-6'>
            <div className='flex flex-col lg:flex-row gap-4 md:gap-6'>
              {/* Groups Section - Show first on mobile, second on desktop */}
              <div className='order-1 lg:order-2 flex-1'>
                <DashboardGroupCards
                  groups={limitedGroups}
                  handleNavigateToGroup={handleNavigateToGroup}
                  limit={6}
                  totalGroups={sortedGroups.length}
                  onViewAll={handleViewAllGroups}
                />
              </div>

              {/* Calendar Sidebar - Show second on mobile, first on desktop */}
              {showCalendar && (
                <div className='order-2 lg:order-1'>
                  <DashboardCalendar
                    getTripsForDate={getTripsForDate}
                    groups={sortedGroups}
                    setShowCalendar={setShowCalendar}
                    showCalendar={showCalendar}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <DashboardBottomNav />

      {/* CreateGroupModal rendering removed */}

      {showJoinModal && (
        <JoinGroupModal onClose={() => setShowJoinModal(false)} />
      )}

      {showWhatsNew && <WhatsNewModal onClose={handleCloseWhatsNew} />}
    </main>
  );
};

export default DashboardComponent;
