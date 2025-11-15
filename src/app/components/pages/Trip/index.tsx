"use client";
import { Group, Trip } from "@/src/shared/types";
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GROUPS } from "../Dashboard/dummdata";
import BottomNav from "./BottomNav";
import TravelSchedule from "./TravelSchedule";
import TravelCalendar from "./TravelCalendar";
import { getStatusBadge } from "@/lib/helper";
import ActivityModal from "../../shared/Modal/ActivityModal";

interface ITripComponent {
  tripId: string;
  groupId: string;
}
const TripComponent = ({ groupId, tripId }: ITripComponent) => {
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<"calendar" | "schedule">(
    "calendar"
  );
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState<boolean>(false);

  const addActivity = () => {
    console.log("ADD ACTIVITY");
  };
  const updateActivity = () => {
    console.log("UPDATE ACTIVITY");
  };
  const deleteActivity = () => {
    console.log("DELETE");
  };
  const toggleDone = () => {
    console.log("DONE");
  };
  const handleStatusChange = (
    newStatus: "planning" | "finalized" | "ongoing" | "cancelled"
  ) => {
    // handleUpdateTrip({ status: newStatus })
    setIsEditingStatus(false);
  };

  useEffect(() => {
    const savedGroups = GROUPS;
    if (savedGroups) {
      const groups = savedGroups;
      const foundGroup = groups.find((g: Group) => g.id === groupId);
      if (foundGroup) {
        setGroup(foundGroup);
        const foundTrip = foundGroup.trips?.find((t: Trip) => t.id === tripId);
        if (foundTrip) {
          setTrip(foundTrip);
        }
      }
    }
    setLoading(false);
  }, [groupId, tripId]);

  if (loading) {
    return (
      <main className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600'>Loading...</p>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
        <div className='text-center'>
          <p className='text-slate-600'>Trip not found</p>
        </div>
      </main>
    );
  }
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const activities = trip.activities || [];
  const statusBadge = getStatusBadge(trip.status);
  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/40 pb-20'>
      <div className='max-w-2xl mx-auto px-4 py-6'>
        <div className='mb-6'>
          <div className='flex items-center gap-3 mb-4'>
            <button
              onClick={() => router.back()}
              className='p-2.5 hover:bg-white/80 bg-white rounded-xl transition-all shadow-sm hover:shadow-md border border-slate-200'
            >
              <ArrowLeft className='w-5 h-5 text-slate-700' />
            </button>
            <div className='bg-white rounded-2xl shadow-md border border-slate-200 px-6 py-4 flex-1'>
              <div className='flex items-start justify-between gap-3 mb-2'>
                <h1 className='text-2xl font-bold text-slate-900'>
                  {trip.name}
                </h1>
                {!isEditingStatus ? (
                  <button
                    onClick={() => setIsEditingStatus(true)}
                    className={`${statusBadge.bg} ${statusBadge.text} text-xs font-semibold px-3 py-1.5 rounded-full border ${statusBadge.border} hover:opacity-80 transition-opacity`}
                  >
                    {statusBadge.label}
                  </button>
                ) : (
                  <select
                    value={trip.status || "planning"}
                    onChange={(e) =>
                      handleStatusChange(
                        e.target.value as
                          | "planning"
                          | "finalized"
                          | "ongoing"
                          | "cancelled"
                      )
                    }
                    onBlur={() => setIsEditingStatus(false)}
                    autoFocus
                    className='text-xs font-semibold px-2 py-1 rounded-full border-2 border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500'
                  >
                    <option value='planning'>Planning</option>
                    <option value='finalized'>Finalized</option>
                    <option value='ongoing'>Ongoing</option>
                    <option value='cancelled'>Cancelled</option>
                  </select>
                )}
              </div>
              <p className='text-sm text-slate-600 flex items-center gap-1.5'>
                <span>📅</span>
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
              </p>
            </div>
          </div>

          <div className='grid grid-cols-2 sm:flex sm:flex-wrap gap-2'>
            <button
              onClick={() => {
                setSelectedDate(null);
                setShowActivityModal(true);
              }}
              className='col-span-2 sm:col-span-1 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-100'
            >
              <Plus className='w-4 h-4' />
              Add Activity
            </button>

            <button
              onClick={() =>
                router.push(`/group/${groupId}/trip/${tripId}/expenses`)
              }
              className='px-5 py-3 rounded-xl bg-white border-2 border-amber-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 transition-all text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2'
            >
              <span>💰</span> Expenses
            </button>

            {activeTab === "schedule" && (
              <button
                onClick={() => {}} //TODO:
                className='px-5 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2'
              >
                <Download className='w-4 h-4' />
                Export
              </button>
            )}

            <button
              onClick={() => {}} //TODO:
              className='px-5 py-3 rounded-xl bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2'
            >
              <Trash2 className='w-4 h-4' />
              <span className='hidden sm:inline'>Delete</span>
            </button>
          </div>
        </div>

        <div
          id='schedule-export-container'
          className='bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6'
        >
          {activeTab === "calendar" ? (
            <TravelCalendar
              startDate={startDate}
              endDate={endDate}
              activities={activities}
              onAddActivity={addActivity}
              onUpdateActivity={updateActivity}
              onDeleteActivity={deleteActivity}
              onToggleDone={toggleDone}
              onOpenAddModal={(date) => {
                setSelectedDate(date);
                setShowActivityModal(true);
              }}
            />
          ) : (
            <TravelSchedule
              startDate={startDate}
              endDate={endDate}
              activities={activities}
              onAddActivity={addActivity}
              onUpdateActivity={updateActivity}
              onDeleteActivity={deleteActivity}
              onToggleDone={toggleDone}
              tripName={trip.name}
            />
          )}
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {showActivityModal && (
        <ActivityModal
          startDate={startDate}
          endDate={endDate}
          preSelectedDate={selectedDate}
          isDateLocked={selectedDate !== null}
          onAddActivity={(activity) => {
            addActivity();
            setShowActivityModal(false);
            setSelectedDate(null);
          }}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedDate(null);
          }}
        />
      )}
    </main>
  );
};

export default TripComponent;
