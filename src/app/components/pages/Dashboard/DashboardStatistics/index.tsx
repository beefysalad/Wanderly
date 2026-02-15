import { Group, Trip } from "@/src/shared/types";
import { Calendar, Users, Plane, Clock } from "lucide-react";
import { useMemo } from "react";

interface IDashboardStatisticsProps {
  groups: Group[];
}

const DashboardStatistics = ({ groups }: IDashboardStatisticsProps) => {
  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const totalTrips = groups.reduce(
      (acc, group) => acc + (group.trips?.length || 0),
      0,
    );

    const allTrips: Trip[] = [];
    groups.forEach((group) => {
      group.trips?.forEach((trip) => {
        allTrips.push(trip);
      });
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingTrips = allTrips.filter((trip) => {
      const startDate = new Date(trip.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate >= today;
    });

    // Calculate days until next trip
    let daysUntilNextTrip: number | null = null;
    if (upcomingTrips.length > 0) {
      const sortedUpcomingTrips = [...upcomingTrips].sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return dateA - dateB;
      });
      const nextTrip = sortedUpcomingTrips[0];
      const nextTripDate = new Date(nextTrip.startDate);
      nextTripDate.setHours(0, 0, 0, 0);
      const diffTime = nextTripDate.getTime() - today.getTime();
      daysUntilNextTrip = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      totalGroups,
      totalTrips,
      upcomingTrips: upcomingTrips.length,
      daysUntilNextTrip,
    };
  }, [groups]);

  const statCards = [
    {
      label: "Groups",
      value: stats.totalGroups,
      icon: Users,
      color: "text-amber-400",
      bgGradient: "from-amber-500/10 to-orange-500/10",
      iconBg: "bg-amber-500/20",
      borderColor: "border-amber-500/20",
      shadowColor: "shadow-amber-500/10",
    },
    {
      label: "Trips",
      value: stats.totalTrips,
      icon: Calendar,
      color: "text-orange-400",
      bgGradient: "from-orange-500/10 to-red-500/10",
      iconBg: "bg-orange-500/20",
      borderColor: "border-orange-500/20",
      shadowColor: "shadow-orange-500/10",
    },
    {
      label: "Upcoming",
      value: stats.upcomingTrips,
      icon: Plane,
      color: "text-blue-400",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      iconBg: "bg-blue-500/20",
      borderColor: "border-blue-500/20",
      shadowColor: "shadow-blue-500/10",
    },
    {
      label: "Next Trip",
      value:
        stats.daysUntilNextTrip !== null ? `${stats.daysUntilNextTrip}d` : "—",
      icon: Clock,
      color: "text-emerald-400",
      bgGradient: "from-emerald-500/10 to-teal-500/10",
      iconBg: "bg-emerald-500/20",
      borderColor: "border-emerald-500/20",
      shadowColor: "shadow-emerald-500/10",
    },
  ];

  return (
    <div className='flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide'>
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className='flex-1 min-w-[140px] bg-slate-900 rounded-xl border border-white/5 p-4 flex items-center justify-between group transition-all duration-300'
          >
            <div>
              <p className='text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5'>
                {stat.label}
              </p>
              <p className='text-xl font-black text-white tracking-tight flex items-baseline gap-1'>
                {stat.value}
              </p>
            </div>
            <div
              className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStatistics;
