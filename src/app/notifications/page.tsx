"use client";
import NotificationPanel from "../components/shared/NotificationBell/NotificationPanel";
import DashboardLayoutHeader from "../components/shared/DashboardLayoutHeader";

const NotificationsPage = () => {
  return (
    <main className='min-h-screen bg-slate-950 pb-24'>
      <div className='max-w-4xl mx-auto px-4 py-6 relative z-10'>
        {/* Header */}
        <DashboardLayoutHeader
          showBack={true}
          title='Notifications'
          sticky={true}
        />

        {/* Notification Panel */}
        <div className='h-[calc(100vh-80px)]'>
          <NotificationPanel />
        </div>
      </div>
    </main>
  );
};

export default NotificationsPage;
