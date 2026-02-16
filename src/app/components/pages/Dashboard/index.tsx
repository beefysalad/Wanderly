import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import type { Trip } from "@/src/shared/types/index";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
// CreateGroupModal import removed
// JoinGroupModal import removed
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

import { useGroups, useJoinGroup } from "@/src/hooks/useGroups";
import { useSocket } from "@/src/hooks/useSocket";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";

interface WhatsNewFeature {
  icon: string;
  title: string;
  description: string;
  color: string;
  bg: string;
}

const DashboardComponent = () => {
  const router = useRouter();
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [currentVersion, setCurrentVersion] = useState("");
  const [features, setFeatures] = useState<WhatsNewFeature[]>([]);
  const [showCalendar, setShowCalendar] = useState(true);
  const { user } = useCurrentUser();
  const { data: groupsData, isLoading: loading } = useGroups();
  const allGroups = groupsData?.groups || [];
  const { socket } = useSocket();
  const joinGroup = useJoinGroup();

  const queryClient = useQueryClient();

  useEffect(() => {
    const handleJoinGroup = () => {
      if (
        localStorage.getItem("fromInvite") === "true" &&
        localStorage.getItem("groupCode")
      ) {
        joinGroup.mutateAsync({
          groupCode: localStorage.getItem("groupCode")!,
        });
        localStorage.removeItem("fromInvite");
        localStorage.removeItem("groupCode");
      }
    };
    handleJoinGroup();
  }, [joinGroup]);
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
  }, [socket, queryClient, joinGroup]);

  useEffect(() => {
    if (!user) return;

    const checkWhatsNew = async () => {
      try {
        const [syncRes, configRes] = await Promise.all([
          api.get("/sync"),
          api.get("/config/whats-new"),
        ]);

        const dbUser = syncRes.data.user;
        const config = configRes.data;

        if (config && config.version) {
          setCurrentVersion(config.version);
          setFeatures(config.features || []);
          if (dbUser && dbUser.lastSeenWhatsNew !== config.version) {
            setShowWhatsNew(true);
          }
        }
      } catch (err) {
        console.error("Failed to check WhatsNew status:", err);
      }
    };

    checkWhatsNew();
  }, [user]);

  const handleCloseWhatsNew = async () => {
    setShowWhatsNew(false);
    if (!currentVersion) return;

    try {
      await api.patch("/user/profile", {
        lastSeenWhatsNew: currentVersion,
      });
    } catch (err) {
      console.error("Failed to update WhatsNew status:", err);
    }
  };

  const sortedGroups = [...allGroups].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

 
  const limitedGroups = sortedGroups.slice(0, 3);

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

    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    return allTrips.filter((trip) => {
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);

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

      <div className='relative z-10'>
        {/* Hero Section */}
        <div className='bg-slate-950/80 backdrop-blur-md border-b border-white/5 pb-8 pt-6 sticky top-0 z-30'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <DashboardLayoutHeader
              title={
                <div className='flex flex-col'>
                  <span className='text-xs font-medium text-slate-400 uppercase tracking-wider mb-1'>
                    Welcome Back
                  </span>
                  <span className='text-2xl md:text-3xl font-bold text-white tracking-tight'>
                    {user?.displayName || "Traveler"}
                  </span>
                </div>
              }
              rightContent={
                <div className='flex items-center gap-3'>
                  <div className='h-8 w-[1px] bg-white/10 mx-2 hidden md:block'></div>
                  <UserMenu />
                  <div className='flex-shrink-0'>
                    <NotificationBell />
                  </div>
                </div>
              }
              sticky={false}
              className='mb-6'
            />

            {/* Actions & Stats */}
            <div className='space-y-6'>
              <div className='flex justify-end'>
                <DashboardCTA />
              </div>
              <DashboardStatistics groups={sortedGroups} />
            </div>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='flex flex-col lg:flex-row gap-8'>
            {/* Main Content Area */}
            <div className='flex-1 space-y-8'>
              {sortedGroups.length > 0 ? (
                <div className='animate-fade-in-up'>
                  <DashboardGroupCards
                    groups={limitedGroups}
                    handleNavigateToGroup={handleNavigateToGroup}
                    limit={3}
                    totalGroups={sortedGroups.length}
                    onViewAll={handleViewAllGroups}
                  />
                </div>
              ) : (
                <div className='bg-slate-900/30 border border-dashed border-white/10 rounded-3xl p-12 text-center animate-fade-in-up'>
                  <div className='w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <span className='text-2xl'>✨</span>
                  </div>
                  <h3 className='text-xl font-bold text-white mb-2'>
                    Start Your Journey
                  </h3>
                  <p className='text-slate-400 max-w-md mx-auto mb-6'>
                    You haven&apos;t joined any trip groups yet. Create a new
                    group to start planning or ask a friend for their invite
                    code!
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar Area */}
            <div className='w-full lg:w-96 space-y-6'>
              {showCalendar && (
                <div className='animate-fade-in-left delay-100'>
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
        </div>
      </div>

      <DashboardBottomNav />



      {showWhatsNew && (
        <WhatsNewModal onClose={handleCloseWhatsNew} features={features} />
      )}
    </main>
  );
};

export default DashboardComponent;
