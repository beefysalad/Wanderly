import { getStatusBadge } from "@/lib/helper";
import { Group } from "@/src/shared/types";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ITripsListComponent {
  group: Group;
  onUpdateGroup: () => void;
}
const TripsListComponent = ({ group, onUpdateGroup }: ITripsListComponent) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const tripsPerPage = 4;

  const handleSelectTrip = (tripId: string) => {
    router.push(`/group/${group.id}/trip/${tripId}`);
  };

  if (!group.trips || group.trips.length === 0) {
    return (
      <div className='bg-white rounded-2xl p-6 sm:p-8 text-center shadow-lg border border-slate-200'>
        <p className='text-slate-600 mb-4'>No trips yet</p>
        <p className='text-sm text-slate-500'>
          Create your first trip to get started
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(group.trips.length / tripsPerPage);
  const startIndex = (currentPage - 1) * tripsPerPage;
  const endIndex = startIndex + tripsPerPage;
  const currentTrips = group.trips.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div>
      <div className='space-y-4 mb-6'>
        {currentTrips.map((trip) => {
          const statusBadge = getStatusBadge(trip.status);

          return (
            <button
              key={trip.id}
              onClick={() => handleSelectTrip(trip.id)}
              className='w-full text-left p-5 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200 hover:border-orange-200 transform hover:-translate-y-1'
            >
              <div className='flex items-start justify-between mb-2'>
                <h3 className='font-bold text-lg text-slate-900'>
                  {trip.name}
                </h3>
                <span
                  className={`${statusBadge.bg} ${statusBadge.text} text-xs font-semibold px-2.5 py-1 rounded-full`}
                >
                  {statusBadge.label}
                </span>
              </div>
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
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className='px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 shadow-sm hover:shadow-md transition-all flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <ChevronLeft className='w-4 h-4' />
            Previous
          </button>
          <span className='px-4 py-2 text-sm font-medium text-slate-600'>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className='px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 shadow-sm hover:shadow-md transition-all flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Next
            <ChevronRight className='w-4 h-4' />
          </button>
        </div>
      )}
    </div>
  );
};

export default TripsListComponent;
