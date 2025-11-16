import { Group, Trip } from "@/src/shared/types";
import { Calendar, Users, Plane, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface IDashboardStatisticsProps {
  groups: Group[];
}

const DashboardStatistics = ({ groups }: IDashboardStatisticsProps) => {
  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const totalTrips = groups.reduce(
      (acc, group) => acc + (group.trips?.length || 0),
      0
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

    const totalMembers = new Set<string>();
    groups.forEach((group) => {
      group.memberEmails?.forEach((email) => {
        totalMembers.add(email);
      });
    });

    return {
      totalGroups,
      totalTrips,
      upcomingTrips: upcomingTrips.length,
      totalMembers: totalMembers.size,
    };
  }, [groups]);

  const statCards = [
    {
      label: "Travel Groups",
      value: stats.totalGroups,
      icon: Users,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
    {
      label: "Total Trips",
      value: stats.totalTrips,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      label: "Upcoming Trips",
      value: stats.upcomingTrips,
      icon: Plane,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      label: "Total Members",
      value: stats.totalMembers,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
  ];

  return (
    <div className='grid grid-cols-2 gap-4 mb-6'>
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`bg-white rounded-xl border ${stat.borderColor} p-4 ${stat.bgColor}/30`}
          >
            <div className='flex items-center gap-3 mb-2'>
              <div
                className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-xs font-medium text-slate-600 mb-0.5'>
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStatistics;

