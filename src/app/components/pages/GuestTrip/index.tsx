"use client";
import { getStatusBadge } from "@/lib/helper";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import { Activity, Trip } from "@/src/shared/types";
import { Calendar, DollarSign, Layout, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DashboardLayoutHeader from "../../shared/DashboardLayoutHeader";
import TravelCalendar from "../Trip/TravelCalendar";
import TravelSchedule from "../Trip/TravelSchedule";
import TravelDayOverview from "../Trip/TravelDayOverview";
import ExpensesList from "../Expenses/ExpenseList";
import { useExpenses, usePaymentLogs } from "@/src/hooks/useExpenses";

interface IGuestTripComponent {
  tripId: string;
  groupId: string;
}

type TabType = "calendar" | "schedule" | "expenses" | "daily";

const GuestTripComponent = ({ groupId, tripId }: IGuestTripComponent) => {
  const router = useRouter();
  const { data: groupData, isLoading: loading } = useGroupAsGuest(groupId);

  const group = groupData || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;

  // Expenses Data
  const { data: expensesData } = useExpenses(tripId);
  const { data: paymentLogsData } = usePaymentLogs(tripId);
  const expenses = expensesData?.expenses || [];
  const paymentLogs = paymentLogsData?.paymentLogs || [];

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(groupId);

  const [activeTab, setActiveTab] = useState<TabType>("calendar");

  const handleViewActivity = (activity: Activity) => {
    router.push(
      `/guest/group/${groupId}/trip/${tripId}/activities/${activity.id}`,
    );
  };

  const handleSelectExpense = (expense: any) => {
    router.push(
      `/guest/group/${groupId}/expenses/${expense.id}?tripId=${tripId}`,
    );
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
        <div className='text-center bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-16 max-w-md'>
          <div className='w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-2xl font-bold text-white mb-3'>Trip Not Found</h2>
          <p className='text-slate-400 mb-8'>
            This trip doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push(`/guest/group/${groupId}`)}
            className='px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-full transition-all font-bold shadow-lg shadow-amber-500/20 hover:scale-105'
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
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px]'></div>
      </div>

      <div className='max-w-4xl mx-auto px-4 py-6 relative z-10'>
        {/* Navigation Bar */}
        <DashboardLayoutHeader
          showBack={true}
          backUrl={`/guest/group/${groupId}`}
          rightContent={
            <div className='flex items-center gap-2'>
              <span className='px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/20 uppercase tracking-tighter'>
                GUEST VIEW
              </span>
            </div>
          }
        />

        {/* Trip Header */}
        <div className='mb-8'>
          <div className='flex flex-col md:flex-row md:items-end justify-between gap-4'>
            <div className='text-center md:text-left'>
              <h1 className='text-4xl md:text-5xl font-bold text-white mb-2 leading-tight'>
                {trip.name}
              </h1>
              <div className='flex items-center gap-3 mb-2 justify-center md:justify-start'>
                <span
                  className={`${statusBadge.bg} ${statusBadge.text} text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border ${statusBadge.border}`}
                >
                  {statusBadge.label}
                </span>

                {trip.createdBy && (
                  <span className='text-xs text-slate-500'>
                    by {trip.createdBy}
                  </span>
                )}
              </div>

              <div className='flex items-center gap-2 text-slate-400 justify-center md:justify-start'>
                <Calendar className='w-4 h-4' />
                <span>
                  {startDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  {" - "}
                  {endDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className='bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-4 sm:p-6 min-h-[400px]'>
          {activeTab === "calendar" ? (
            <TravelCalendar
              startDate={startDate}
              endDate={endDate}
              activities={activities}
              readOnly={true}
              onViewActivity={handleViewActivity}
            />
          ) : activeTab === "expenses" ? (
            <ExpensesList
              expenses={expenses}
              members={group?.memberEmails || []}
              memberNames={group?.memberNames}
              memberMetadata={group?.memberMetadata}
              activities={activities}
              paymentLogs={paymentLogs}
              readOnly={true}
              onSelectExpense={handleSelectExpense}
            />
          ) : activeTab === "daily" ? (
            <TravelDayOverview
              startDate={startDate}
              endDate={endDate}
              activities={activities}
            
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

      {/* Floating Tab Switcher */}
      <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50'>
        <div className='flex bg-slate-900/80 backdrop-blur-xl p-1.5 rounded-full border border-white/10 shadow-2xl shadow-black/50'>
          <button
            onClick={() => setActiveTab("daily")}
            className={`group relative p-3 rounded-full transition-all duration-300 ${
              activeTab === "daily"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layout className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
            <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
              Day Overview
            </span>
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`group relative p-3 rounded-full transition-all duration-300 ${
              activeTab === "schedule"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <List className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
            <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
              Timeline
            </span>
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`group relative p-3 rounded-full transition-all duration-300 ${
              activeTab === "calendar"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Calendar className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
            <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
              Calendar
            </span>
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`group relative p-3 rounded-full transition-all duration-300 ${
              activeTab === "expenses"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <DollarSign className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
            <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
              Expenses
            </span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default GuestTripComponent;
