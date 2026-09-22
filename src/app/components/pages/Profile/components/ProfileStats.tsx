"use client";
import { Calendar, Globe, MapPin, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Group } from "@/src/shared/types";

interface ProfileStatsProps {
  groups: Group[];
}

export function ProfileStats({ groups }: ProfileStatsProps) {
  const router = useRouter();

  const totalGroups = groups.length;
  const totalTrips = groups.reduce((acc, g) => acc + (g.trips?.length || 0), 0);
  const totalActivities = groups.reduce(
    (acc, g) =>
      acc +
      (g.trips?.reduce((tAcc, t) => tAcc + (t.activities?.length || 0), 0) || 0),
    0,
  );
  const uniqueLocations = Array.from(
    new Set(groups.flatMap((g) => g.trips?.map((t) => t.location).filter(Boolean) || [])),
  ).length;

  const stats = [
    { label: "Groups", value: totalGroups, icon: Users },
    { label: "Destinations", value: uniqueLocations, icon: Globe },
    { label: "Activities", value: totalActivities, icon: Calendar },
    { label: "Trips", value: totalTrips, icon: MapPin },
  ];

  return (
    <div className='space-y-10'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        {stats.map((stat) => (
          <div key={stat.label} className='bg-slate-900/60 border border-white/10 rounded-2xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <p className='text-xs text-slate-400'>{stat.label}</p>
              <stat.icon className='w-4 h-4 text-slate-500' />
            </div>
            <p className='text-2xl sm:text-3xl font-semibold text-white'>{stat.value}</p>
          </div>
        ))}
      </div>

      {groups.length > 0 && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-base font-semibold text-white'>Recent Journeys</h3>
            <button
              onClick={() => router.push("/groups")}
              className='text-sm text-slate-400 hover:text-white transition-colors'
            >
              View All
            </button>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {groups.slice(0, 4).map((group) => (
              <div
                key={group.id}
                onClick={() => router.push(`/group/${group.id}`)}
                className='p-4 bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 rounded-2xl transition-colors cursor-pointer'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl'>
                    {group.emoji || "✈️"}
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-semibold text-white text-sm mb-1'>{group.name}</h4>
                    <div className='flex items-center gap-3'>
                      <p className='text-xs text-slate-400'>{group.trips?.length || 0} trips</p>
                      <div className='w-1 h-1 rounded-full bg-slate-600' />
                      <p className='text-xs text-slate-400'>
                        {group.memberEmails?.length || 0} members
                      </p>
                    </div>
                  </div>
                  <span className='text-xs text-slate-500'>Open</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
