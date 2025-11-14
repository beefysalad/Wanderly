import { Group } from "@/src/shared/types";
import { useRouter } from "next/navigation";
import React from "react";

interface ITripsListComponent {
  group: Group;
  onUpdateGroup: () => void;
}
const TripsListComponent = ({ group, onUpdateGroup }: ITripsListComponent) => {
  const router = useRouter();

  const handleSelectTrip = (tripId: string) => {
    // router.push(`/group/${group.id}/trip/${tripId}`);
    alert("NAVIFATING");
  };
  return (
    <div>
      {!group.trips || group.trips.length === 0 ? (
        <div className='bg-white rounded-xl p-8 text-center shadow-md border border-slate-100'>
          <p className='text-slate-600 mb-4'>No trips yet</p>
          <p className='text-sm text-slate-500'>
            Create your first trip to get started
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {group.trips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => handleSelectTrip(trip.id)}
              className='w-full text-left p-5 bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-amber-200 transform hover:-translate-y-1'
            >
              <h3 className='font-bold text-lg text-slate-900'>{trip.name}</h3>
              <p className='text-sm text-slate-600 mt-2 flex items-center gap-2'>
                <span>📅</span>
                {new Date(trip.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {new Date(trip.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className='text-sm text-slate-500 mt-2 bg-slate-50 px-3 py-1 rounded-lg inline-block'>
                {trip.activities?.length || 0}{" "}
                {trip.activities?.length === 1 ? "activity" : "activities"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripsListComponent;
