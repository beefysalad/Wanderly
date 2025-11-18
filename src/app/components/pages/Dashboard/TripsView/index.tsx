import { Trip, Group } from "@/src/shared/types";
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useNavigationLoading } from "@/src/hooks/useNavigationLoading";
import NavigationLoader from "../../../shared/NavigationLoader";

interface ITripsViewProps {
  groups: Group[];
}

const ITEMS_PER_PAGE = 10;

const TripsView = ({ groups }: ITripsViewProps) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const { isNavigating, withNavigation } = useNavigationLoading();

  const allTrips = useMemo(() => {
    const trips: Array<
      Trip & { groupId: string; groupName: string; groupCode: string }
    > = [];

    groups.forEach((group) => {
      group.trips?.forEach((trip) => {
        trips.push({
          ...trip,
          groupId: group.id,
          groupName: group.name,
          groupCode: group.code,
        });
      });
    });

    // Sort by start date (upcoming first)
    return trips.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return dateA - dateB;
    });
  }, [groups]);

  const totalPages = Math.ceil(allTrips.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTrips = allTrips.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "ongoing":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "finalized":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (allTrips.length === 0) {
    return (
      <div className='bg-white rounded-xl border border-slate-200 p-12 text-center'>
        <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <Calendar className='w-8 h-8 text-slate-400' />
        </div>
        <p className='text-slate-600 font-medium mb-2'>No trips yet</p>
        <p className='text-slate-500 text-sm'>
          Create or join a group to start planning trips.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-4'>
        {paginatedTrips.map((trip) => {
          const startDate = new Date(trip.startDate);
          const endDate = new Date(trip.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isUpcoming = startDate >= today;
          const isPast = endDate < today;

          return (
            <button
              key={`${trip.groupId}-${trip.id}`}
              onClick={() => {
                withNavigation(async () => {
                  router.push(`/group/${trip.groupId}/trip/${trip.id}`);
                });
              }}
              className='w-full bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-300 hover:shadow-lg transition-all duration-200 text-left active:scale-[0.98]'
            >
              <div className='flex items-start justify-between gap-3 mb-3'>
                <div className='flex-1 min-w-0'>
                  <h3 className='text-lg font-semibold text-slate-900 mb-1 truncate'>
                    {trip.name}
                  </h3>
                  <div className='flex items-center gap-2 text-sm text-slate-600 mb-2'>
                    <Users className='w-4 h-4 flex-shrink-0' />
                    <span className='truncate'>{trip.groupName}</span>
                  </div>
                </div>
                {trip.status && (
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border flex-shrink-0 ${getStatusColor(
                      trip.status
                    )}`}
                  >
                    {trip.status}
                  </span>
                )}
              </div>

              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm text-slate-600'>
                  <Calendar className='w-4 h-4 text-orange-500 flex-shrink-0' />
                  <span>
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </span>
                </div>
                {trip.location && (
                  <div className='flex items-center gap-2 text-sm text-slate-600'>
                    <MapPin className='w-4 h-4 text-orange-500 flex-shrink-0' />
                    <span className='truncate'>{trip.location}</span>
                  </div>
                )}
                <div className='flex items-center justify-end pt-2'>
                  <ArrowRight className='w-4 h-4 text-orange-500' />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className='mt-6 flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4'>
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              currentPage === 1
                ? "text-slate-400 cursor-not-allowed"
                : "text-slate-700 hover:bg-slate-50 hover:text-orange-600"
            }`}
          >
            <ChevronLeft className='w-4 h-4' />
            Previous
          </button>

          <span className='text-sm font-medium text-slate-600'>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              currentPage === totalPages
                ? "text-slate-400 cursor-not-allowed"
                : "text-slate-700 hover:bg-slate-50 hover:text-orange-600"
            }`}
          >
            Next
            <ChevronRight className='w-4 h-4' />
          </button>
        </div>
      )}

      {isNavigating && <NavigationLoader message='Loading trip...' />}
    </>
  );
};

export default TripsView;
