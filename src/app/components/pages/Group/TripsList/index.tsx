import { Group, Trip } from "@/src/shared/types";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  ArrowRight,
  Plus,
} from "lucide-react";
import NavigationLoader from "../../../shared/NavigationLoader";
import { useNavigationLoading } from "@/src/hooks/useNavigationLoading";

interface ITripsListComponent {
  group?: Group;
  trips?: Trip[];
  groupId: string;
  readOnly?: boolean;
}
const TripsListComponent = ({
  group,
  trips,
  groupId,
  readOnly = false,
}: ITripsListComponent) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const tripsPerPage = 4;
  const { isNavigating, withNavigation } = useNavigationLoading();

  const tripsList = trips || group?.trips || [];

  const handleSelectTrip = (tripId: string) => {
    withNavigation(async () => {
      if (readOnly) {
        router.push(`/guest/group/${groupId}/trip/${tripId}`);
      } else {
        router.push(`/group/${groupId}/trip/${tripId}`);
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!tripsList || tripsList.length === 0) {
    return (
      <div className='bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-white/5 p-12 text-center'>
        <div className='w-16 h-16 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4'>
          <Calendar className='w-8 h-8 text-orange-400' />
        </div>
        <p className='text-lg font-semibold text-white mb-2'>No trips yet</p>
        <p className='text-sm text-slate-400 max-w-xs mx-auto mb-6'>
          {readOnly
            ? "This group doesn't have any trips yet."
            : "Create your first trip to get started planning your adventure!"}
        </p>
        {!readOnly && (
          <button
            onClick={() => router.push(`/group/${groupId}/trips/create`)}
            className='inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-orange-500/20 transition-all transform hover:-translate-y-0.5'
          >
            <Plus className='w-4 h-4' />
            Create Your First Trip
          </button>
        )}
      </div>
    );
  }

  const totalPages = Math.ceil(tripsList.length / tripsPerPage);
  const startIndex = (currentPage - 1) * tripsPerPage;
  const endIndex = startIndex + tripsPerPage;
  const currentTrips = tripsList.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // Get days until trip
  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div>
      <div className='space-y-3 mb-6'>
        {currentTrips.map((trip) => {
          const startDate = new Date(trip.startDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const isUpcoming = startDate >= today;
          const daysUntil = getDaysUntil(trip.startDate);

          return (
            <button
              key={trip.id}
              onClick={() => handleSelectTrip(trip.id)}
              className='group w-full text-left p-4 bg-slate-800/20 hover:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all duration-300'
            >
              <div className='flex items-start gap-4'>
                {/* Date Box */}
                <div className='hidden sm:flex flex-col items-center justify-center w-14 h-14 bg-slate-800/50 rounded-xl border border-white/5 flex-shrink-0'>
                  <span className='text-xs font-bold text-orange-400 uppercase'>
                    {startDate.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className='text-xl font-bold text-white'>
                    {startDate.getDate()}
                  </span>
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between gap-3 mb-1'>
                    <h3 className='font-bold text-lg text-white group-hover:text-orange-400 transition-colors truncate'>
                      {trip.name}
                    </h3>
                    {isUpcoming && daysUntil <= 7 && daysUntil > 0 && (
                      <span className='text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 flex-shrink-0'>
                        {daysUntil}d left
                      </span>
                    )}
                  </div>

                  <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400 mb-2'>
                    <div className='flex items-center gap-1.5'>
                      <Calendar className='w-3.5 h-3.5 text-orange-400' />
                      <span>
                        {formatDate(trip.startDate)}{" "}
                        <span className='text-slate-600 px-0.5'>→</span>{" "}
                        {formatDate(trip.endDate)}
                      </span>
                    </div>
                  </div>

                  {trip.location && (
                    <div className='flex items-center gap-1.5 text-sm text-slate-500'>
                      <MapPin className='w-3.5 h-3.5' />
                      <span className='truncate'>{trip.location}</span>
                    </div>
                  )}
                </div>

                <ArrowRight className='w-5 h-5 text-slate-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all self-center' />
              </div>
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className='p-2 rounded-xl bg-slate-800/50 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>
          <span className='text-sm font-medium text-slate-400 px-2'>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className='p-2 rounded-xl bg-slate-800/50 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
          >
            <ChevronRight className='w-5 h-5' />
          </button>
        </div>
      )}

      {isNavigating && <NavigationLoader message='Loading trip...' />}
    </div>
  );
};

export default TripsListComponent;
