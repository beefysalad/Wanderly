"use client";
import { getStatusBadge } from "@/lib/helper";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useGuest } from "@/src/hooks/useGuest";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import { Activity, Trip } from "@/src/shared/types";
import { ArrowLeft, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ActivityDetailModal from "../../shared/Modal/ActivityDetailModal";
import BottomNav from "../Trip/BottomNav";
import TravelCalendar from "../Trip/TravelCalendar";
import TravelSchedule from "../Trip/TravelSchedule";

interface IGuestTripComponent {
  tripId: string;
  groupId: string;
}

const GuestTripComponent = ({ groupId, tripId }: IGuestTripComponent) => {
  const router = useRouter();
  const guestSession = useGuest();
  const { data: groupData, isLoading: loading } = useGroupAsGuest(groupId);
  const group = groupData || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(groupId);
  const [activeTab, setActiveTab] = useState<
    "calendar" | "schedule" | "dashboard" | "profile"
  >("calendar");

  // Handle tab changes - only allow calendar/schedule for guests
  const handleTabChange = (
    tab: "calendar" | "schedule" | "dashboard" | "profile"
  ) => {
    if (tab === "calendar" || tab === "schedule") {
      setActiveTab(tab);
    }
    // Ignore dashboard and profile tabs for guests
  };

  const [showActivityDetailModal, setShowActivityDetailModal] =
    useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );

  const handleViewActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowActivityDetailModal(true);
  };

  if (loading) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 flex items-center justify-center'>
        <div className='text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8'>
          <div className='w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-700 font-medium'>Loading trip...</p>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 flex items-center justify-center p-4'>
        <div className='text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8 max-w-md'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-xl font-bold text-slate-900 mb-2'>
            Trip Not Found
          </h2>
          <p className='text-slate-600 mb-6'>
            This trip doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push(`/guest/group/${groupId}`)}
            className='px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg'
          >
            Go Back to Group
          </button>
        </div>
      </main>
    );
  }

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const activities = trip.activities || [];
  const statusBadge = getStatusBadge(trip.status);

  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 pb-32 md:pb-24'>
      <div className='max-w-4xl mx-auto px-4 py-6'>
        {/* Back Button */}
        <button
          onClick={() => router.push(`/guest/group/${groupId}`)}
          className='mb-6 px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900 hover:bg-white/60 backdrop-blur-sm'
          aria-label='Go back'
        >
          <ArrowLeft className='w-5 h-5' />
          Back
        </button>

        {/* Content wrapper to match calendar cards alignment */}
        <div className='p-4 sm:p-6'>
          {/* Trip Header Info */}
          <div className='mb-6'>
            <div className='flex items-start justify-between gap-4 mb-3'>
              <h1 className='text-3xl sm:text-4xl font-bold text-slate-900 leading-tight'>
                {trip.name}
              </h1>
            </div>

            {/* Status Badge */}
            <div className='mb-3'>
              <span
                className={`${statusBadge.bg} ${statusBadge.text} text-xs font-semibold px-4 py-2 rounded-full border ${statusBadge.border} shadow-sm inline-flex items-center`}
              >
                {statusBadge.label}
              </span>
            </div>

            <p className='text-sm sm:text-base text-slate-600 flex items-center gap-2 mb-2'>
              <span className='text-lg'>📅</span>
              <span>
                {startDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {endDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
            {trip.createdBy && (
              <p className='text-xs text-slate-600 flex items-center gap-1.5'>
                <span>Trip created by {trip.createdBy}</span>
              </p>
            )}
            {guestSession && (
              <p className='text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-lg inline-flex items-center gap-2 mt-2'>
                <Users className='w-4 h-4' />
                Viewing as Guest: {guestSession.guestName}
              </p>
            )}
          </div>

          {/* Action Buttons Group */}
          <div className='mb-6'>
            <div className='flex flex-col sm:flex-row gap-3'>
              {/* Primary Action Button */}
              <button
                disabled
                className='flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-slate-200 text-slate-500 cursor-not-allowed opacity-50 font-semibold shadow-md flex items-center justify-center gap-2'
              >
                <span className='text-lg'>➕</span>
                <span>Add Activity</span>
              </button>

              {/* Secondary Action Buttons */}
              <div className='flex gap-3 flex-1 sm:flex-initial'>
                <button
                  onClick={() =>
                    router.push(
                      `/guest/group/${groupId}/trip/${tripId}/expenses`
                    )
                  }
                  className='flex-1 px-4 py-3 rounded-xl bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 border border-slate-200/50 hover:border-slate-300 transition-all font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.98]'
                >
                  <span className='text-lg'>💰</span>
                  <span className='hidden sm:inline'>Expenses</span>
                </button>

                <button
                  disabled
                  className='flex-1 px-4 py-3 rounded-xl bg-slate-200 text-slate-500 cursor-not-allowed opacity-50 font-medium shadow-sm flex items-center justify-center gap-2'
                >
                  <span className='text-lg'>🚫</span>
                  <span className='hidden sm:inline'>Export</span>
                </button>

                <button
                  disabled
                  className='flex-1 px-4 py-3 rounded-xl bg-slate-200 text-slate-500 cursor-not-allowed opacity-50 font-medium shadow-sm flex items-center justify-center gap-2'
                >
                  <span className='text-lg'>🗑️</span>
                  <span className='hidden sm:inline'>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          id='schedule-export-container'
          className='p-4 sm:p-6 relative overflow-hidden'
        >
          <div className='relative z-10'>
            {activeTab === "calendar" ? (
              <TravelCalendar
                startDate={startDate}
                endDate={endDate}
                activities={activities}
                readOnly={true}
                onViewActivity={handleViewActivity}
              />
            ) : (
              <TravelSchedule
                startDate={startDate}
                endDate={endDate}
                activities={activities}
                tripName={trip.name}
                readOnly={true}
                onViewActivity={handleViewActivity}
              />
            )}
          </div>
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {showActivityDetailModal && selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => {
            setShowActivityDetailModal(false);
            setSelectedActivity(null);
          }}
          readOnly={true}
        />
      )}
    </main>
  );
};

export default GuestTripComponent;
