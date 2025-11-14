import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { getDaysInMonth, getFirstDayOfMonth } from "@/lib/helper";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { signOut } from "firebase/auth";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Code2,
  Compass,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import type { User, Group, Trip } from "@/src/shared/types/index";
import { GROUPS } from "./dummdata";
import DashboardHeader from "./DashboardHeader";
import DashboardCTA from "./DashboardCTA";
import DashboardCalendar from "./DashboardCalendar";
import DashboardGroupCards from "./DashboardGroupCards";

const DashboardComponent = () => {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);
  const { user } = useCurrentUser();
  const groups = GROUPS;
  const handleLogout = async () => {
    await signOut(auth);
  };
  const handleProfileClick = () => {
    router.push("/profile");
  };
  const handleNavigateToGroup = (groupId: string) => {
    router.push(`/group/${groupId}`);
  };
  if (loading) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600 font-medium'>Loading your groups...</p>
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

    groups.forEach((group, index) => {
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
    return allTrips.filter((trip) => {
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      return date >= startDate && date <= endDate;
    });
  };

  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <DashboardHeader
          handleLogout={handleLogout}
          handleProfileClick={handleProfileClick}
          userEmail={user?.email ?? ""}
        />

        <DashboardCTA
          setShowCreateModal={setShowCreateModal}
          setShowJoinModal={setShowJoinModal}
        />
        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Calendar Sidebar */}
          {groups.length > 0 && (
            <DashboardCalendar
              getTripsForDate={getTripsForDate}
              groups={groups}
              setShowCalendar={setShowCalendar}
              showCalendar={showCalendar}
            />
          )}

          {/* Groups Section */}
          <DashboardGroupCards
            groups={groups}
            handleNavigateToGroup={handleNavigateToGroup}
          />
        </div>
      </div>

      {/* {showCreateModal && (
        <CreateGroupModal
          onCreateGroup={handleCreateGroup}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showJoinModal && (
        <JoinGroupModal
          onClose={() => setShowJoinModal(false)}
          onJoin={handleJoinGroup}
          currentUser={currentUser}
        />
      )} */}
    </main>
  );
};

export default DashboardComponent;
