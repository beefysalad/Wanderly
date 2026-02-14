"use client";
import NotificationPanel from "../components/shared/NotificationBell/NotificationPanel";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const NotificationsPage = () => {
  const router = useRouter();

  return (
    <main className='min-h-screen bg-slate-950 pb-24'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-4'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => router.back()}
              className='p-2 rounded-lg hover:bg-white/10 transition-colors'
            >
              <ArrowLeft className='w-5 h-5 text-white' />
            </button>
            <h1 className='text-xl font-bold text-white'>Notifications</h1>
          </div>
        </div>

        {/* Notification Panel */}
        <div className='h-[calc(100vh-80px)]'>
          <NotificationPanel />
        </div>
      </div>
    </main>
  );
};

export default NotificationsPage;
