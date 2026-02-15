"use client";
import { useGroups } from "@/src/hooks/useGroups";
import { Trip } from "@/src/shared/types";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import DashboardBottomNav from "../components/pages/Dashboard/DashboardBottomNav";
import DashboardLayoutHeader from "../components/shared/DashboardLayoutHeader";

const TripsPage = () => {
  const router = useRouter();
  const { data: groupsData, isLoading } = useGroups();
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  const handleLogout = async () => {
    await signOut(auth);
  };

  const allTrips = useMemo(() => {
    const allGroups = groupsData?.groups || [];
    const trips: Array<
      Trip & { groupId: string; groupName: string; groupColor: string }
    > = [];

    const colors = [
      "from-amber-500 to-orange-500",
      "from-rose-500 to-pink-500",
      "from-purple-500 to-indigo-500",
      "from-blue-500 to-cyan-500",
      "from-teal-500 to-emerald-500",
    ];

    allGroups.forEach((group, index) => {
      const groupColor = colors[index % colors.length];
      group.trips?.forEach((trip) => {
        trips.push({
          ...trip,
          groupId: group.id,
          groupName: group.name,
          groupColor,
        });
      });
    });

    // Sort by start date
    return trips.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return dateA - dateB;
    });
  }, [groupsData?.groups]);

  const filteredTrips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === "upcoming") {
      return allTrips.filter((trip) => new Date(trip.startDate) >= today);
    } else if (filter === "past") {
      return allTrips.filter((trip) => new Date(trip.endDate) < today);
    }
    return allTrips;
  }, [allTrips, filter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center pb-24'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-400 font-medium'>Loading trips...</p>
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
        {/* Header */}
        <DashboardLayoutHeader
          showBack={true}
          backUrl='/dashboard'
          title='Your Trips'
          description={`${filteredTrips.length} ${filteredTrips.length === 1 ? "trip" : "trips"} ${filter !== "all" ? `• ${filter}` : ""}`}
        />

        {/* Filters */}
        <div className='flex gap-2 mb-6 bg-slate-800/30 backdrop-blur-xl rounded-2xl p-1.5 border border-white/5 w-fit'>
          <button
            onClick={() => setFilter("all")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === "all"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === "upcoming"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === "past"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Past
          </button>
        </div>

        {/* Trips List */}
        {filteredTrips.length === 0 ? (
          <div className='bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-white/5 p-16 text-center'>
            <div className='w-20 h-20 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6'>
              <Calendar className='w-10 h-10 text-orange-400' />
            </div>
            <h3 className='text-xl font-bold text-white mb-2'>
              No {filter !== "all" && filter} trips
            </h3>
            <p className='text-sm text-slate-400 max-w-sm mx-auto'>
              {filter === "all"
                ? "Create or join a group to start planning your adventures."
                : `You don't have any ${filter} trips at the moment.`}
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {filteredTrips.map((trip) => {
              const startDate = new Date(trip.startDate);
              const endDate = new Date(trip.endDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isUpcoming = startDate >= today;
              const isPast = endDate < today;
              const daysUntil = getDaysUntil(trip.startDate);

              return (
                <button
                  key={`${trip.groupId}-${trip.id}`}
                  onClick={() =>
                    router.push(`/group/${trip.groupId}/trip/${trip.id}`)
                  }
                  className='group w-full bg-slate-800/20 hover:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-5 border border-white/5 hover:border-orange-500/30 transition-all duration-300 text-left'
                >
                  <div className='flex items-start gap-4'>
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${trip.groupColor} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}
                    >
                      <Calendar className='w-7 h-7 text-white' />
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-3 mb-2'>
                        <h3 className='text-lg font-bold text-white group-hover:text-orange-400 transition-colors truncate'>
                          {trip.name}
                        </h3>
                        {isUpcoming && daysUntil <= 7 && daysUntil > 0 && (
                          <span className='text-xs font-bold px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 flex-shrink-0'>
                            {daysUntil}d left
                          </span>
                        )}
                        {isUpcoming && daysUntil > 7 && (
                          <span className='text-xs font-medium px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 flex-shrink-0'>
                            Upcoming
                          </span>
                        )}
                        {isPast && (
                          <span className='text-xs font-medium px-3 py-1 bg-slate-700/50 text-slate-400 rounded-full border border-white/10 flex-shrink-0'>
                            Completed
                          </span>
                        )}
                      </div>

                      <div className='flex items-center gap-2 text-xs text-slate-400 mb-3'>
                        <Users className='w-3.5 h-3.5' />
                        <span className='truncate font-medium'>
                          {trip.groupName}
                        </span>
                      </div>

                      <div className='space-y-2'>
                        <div className='flex items-center gap-2 text-sm text-slate-300'>
                          <Calendar className='w-4 h-4 text-orange-400' />
                          <span className='font-medium'>
                            {formatDate(trip.startDate)} →{" "}
                            {formatDate(trip.endDate)}
                          </span>
                        </div>
                        {trip.location && (
                          <div className='flex items-center gap-2 text-sm text-slate-300'>
                            <MapPin className='w-4 h-4 text-amber-400' />
                            <span className='truncate'>{trip.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <DashboardBottomNav onLogout={handleLogout} />
    </main>
  );
};

export default TripsPage;
