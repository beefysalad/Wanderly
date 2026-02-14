import { getStatusBadge } from "@/lib/helper";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import { Activity, Trip } from "@/src/shared/types";
import { ArrowLeft } from "lucide-react";

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
    tab: "calendar" | "schedule" | "dashboard" | "profile",
  ) => {
    if (tab === "calendar" || tab === "schedule") {
      setActiveTab(tab);
    }
    // Ignore dashboard and profile tabs for guests
  };

  const [showActivityDetailModal, setShowActivityDetailModal] =
    useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );

  const handleViewActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowActivityDetailModal(true);
  };

  if (loading) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-400 font-medium'>Loading trip...</p>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-white/5 p-16 max-w-md'>
          <div className='w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-2xl font-bold text-white mb-3'>Trip Not Found</h2>
          <p className='text-slate-400 mb-8'>
            This trip doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push(`/guest/group/${groupId}`)}
            className='px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl'
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
    <main className='min-h-screen bg-slate-950 pb-32 md:pb-24 relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-3xl'></div>
      </div>

      <div className='max-w-4xl mx-auto px-4 py-6 relative z-10'>
        {/* Header Navigation */}
        <div className='flex items-center justify-between mb-8'>
          <button
            onClick={() => router.push(`/guest/group/${groupId}`)}
            className='p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors inline-flex items-center gap-2 text-slate-400 hover:text-white group'
          >
            <ArrowLeft className='w-5 h-5 transition-transform group-hover:-translate-x-1' />
            <span className='font-medium'>Back</span>
          </button>

          <div className='flex items-center gap-2'>
            <span className='px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/20 uppercase tracking-tighter'>
              GUEST VIEW
            </span>
          </div>
        </div>

        {/* Trip Header Info */}
        <div className='mb-8 px-1'>
          <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4'>
            <div>
              <h1 className='text-4xl font-bold text-white mb-3 leading-tight'>
                {trip.name}
              </h1>
              <div className='flex flex-wrap items-center gap-3 text-slate-400'>
                <div className='flex items-center gap-2'>
                  <span className='text-lg'>📅</span>
                  <span className='text-sm font-medium'>
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
                </div>
                {trip.createdBy && (
                  <>
                    <span className='w-1 h-1 rounded-full bg-slate-700'></span>
                    <span className='text-xs'>By {trip.createdBy}</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <span
                className={`${statusBadge.bg} ${statusBadge.text} text-xs font-bold px-4 py-2 rounded-full border ${statusBadge.border} shadow-sm inline-flex items-center uppercase tracking-wider`}
              >
                {statusBadge.label}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className='flex flex-wrap gap-3 mt-6'>
            <button
              onClick={() =>
                router.push(`/guest/group/${groupId}/trip/${tripId}/expenses`)
              }
              className='px-5 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-700/60 text-white border border-white/5 transition-all text-sm font-semibold flex items-center gap-2 active:scale-95 group'
            >
              <span className='text-lg group-hover:scale-110 transition-transform'>
                💰
              </span>
              <span>View Expenses</span>
            </button>
            <div className='flex-1'></div>
            <button
              disabled
              className='px-5 py-2.5 rounded-xl bg-slate-800/20 text-slate-600 border border-white/5 transition-all text-sm font-semibold flex items-center gap-2 cursor-not-allowed opacity-50'
            >
              <span className='text-lg'>🔒</span>
              <span>Edit Trip</span>
            </button>
          </div>
        </div>

        {/* View Selection (Calendar/Schedule) */}
        <div className='mt-8'>
          <div className='flex items-center justify-between mb-6 px-1'>
            <div className='flex items-center gap-1 bg-slate-800/30 p-1 rounded-xl border border-white/5'>
              <button
                onClick={() => handleTabChange("calendar")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === "calendar"
                    ? "bg-amber-500 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => handleTabChange("schedule")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === "schedule"
                    ? "bg-amber-500 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Schedule
              </button>
            </div>
            <div className='h-px flex-1 bg-white/5 ml-6'></div>
          </div>

          <div id='schedule-export-container' className='relative'>
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
