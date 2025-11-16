import { auth } from "@/lib/firebase";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import type { Trip } from "@/src/shared/types/index";
import { signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import CreateGroupModal from "../../shared/Modal/CreateGroupModal";
import JoinGroupModal from "../../shared/Modal/JoinGroupModal";
import DashboardCTA from "./DashboardCTA";
import DashboardCalendar from "./DashboardCalendar";
import DashboardGroupCards from "./DashboardGroupCards";
import DashboardHeader from "./DashboardHeader";
import DashboardBottomNav from "./DashboardBottomNav";
import DashboardStatistics from "./DashboardStatistics";
import TripsView from "./TripsView";
import GroupsView from "./GroupsView";
import { useGroups } from "@/src/hooks/useGroups";

const DashboardComponent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);

  // Get initial tab from URL query param, default to "dashboard"
  const tabParam = searchParams.get("tab") as
    | "dashboard"
    | "trips"
    | "groups"
    | "profile"
    | null;
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "trips" | "groups" | "profile"
  >(
    tabParam && ["dashboard", "trips", "groups", "profile"].includes(tabParam)
      ? tabParam
      : "dashboard"
  );
  const { user } = useCurrentUser();
  const { data: groupsData, isLoading: loading } = useGroups();
  const allGroups = groupsData?.groups || [];

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

  // Handle tab changes - update URL for non-profile tabs
  const handleTabChange = (
    tab: "dashboard" | "trips" | "groups" | "profile"
  ) => {
    setActiveTab(tab);
    if (tab !== "profile") {
      router.replace(`/dashboard?tab=${tab}`, { scroll: false });
    }
  };

  const handleViewAllGroups = () => {
    handleTabChange("groups");
  };

  // Redirect to profile page when profile tab is clicked
  useEffect(() => {
    if (activeTab === "profile") {
      router.push("/profile");
    }
  }, [activeTab, router]);

  if (loading) {
    return (
      <main className='min-h-screen flex items-center justify-center'>
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
      date.getDate()
    );

    return allTrips.filter((trip) => {
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);

      // Normalize trip dates to midnight (remove time component)
      const normalizedStartDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );
      const normalizedEndDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );

      return (
        normalizedDate >= normalizedStartDate &&
        normalizedDate <= normalizedEndDate
      );
    });
  };

  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 pb-24 md:pb-20'>
      <div className='max-w-4xl mx-auto px-4 py-4 md:py-6'>
        {activeTab === "dashboard" && (
          <>
            <DashboardHeader
              handleLogout={handleLogout}
              userEmail={user?.email ?? ""}
            />

            <DashboardStatistics groups={sortedGroups} />

            <DashboardCTA
              setShowCreateModal={setShowCreateModal}
              setShowJoinModal={setShowJoinModal}
            />

            {sortedGroups.length > 0 && (
              <div className='mt-6'>
                <div className='flex flex-col lg:flex-row gap-4 md:gap-6'>
                  {/* Calendar Sidebar */}
                  {showCalendar && (
                    <DashboardCalendar
                      getTripsForDate={getTripsForDate}
                      groups={sortedGroups}
                      setShowCalendar={setShowCalendar}
                      showCalendar={showCalendar}
                    />
                  )}

                  {/* Groups Section */}
                  <DashboardGroupCards
                    groups={limitedGroups}
                    handleNavigateToGroup={handleNavigateToGroup}
                    limit={6}
                    totalGroups={sortedGroups.length}
                    onViewAll={handleViewAllGroups}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "trips" && (
          <div>
            <div className='mb-6'>
              <h2 className='text-2xl font-bold text-slate-900'>All Trips</h2>
              <p className='text-slate-600 text-sm mt-1'>
                View all your trips across all groups
              </p>
            </div>
            <TripsView groups={sortedGroups} />
          </div>
        )}

        {activeTab === "groups" && (
          <div>
            <div className='mb-6'>
              <h2 className='text-2xl font-bold text-slate-900'>All Groups</h2>
              <p className='text-slate-600 text-sm mt-1'>
                Manage your travel groups
              </p>
            </div>
            <GroupsView
              groups={sortedGroups}
              handleNavigateToGroup={handleNavigateToGroup}
            />
          </div>
        )}
      </div>

      <DashboardBottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {showCreateModal && (
        <CreateGroupModal onClose={() => setShowCreateModal(false)} />
      )}

      {showJoinModal && (
        <JoinGroupModal onClose={() => setShowJoinModal(false)} />
      )}
    </main>
  );
};

export default DashboardComponent;
