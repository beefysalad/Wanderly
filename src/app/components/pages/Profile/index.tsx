"use client";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useGroups } from "@/src/hooks/useGroups";
import {
  ArrowLeft,
  Mail,
  Calendar,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import DashboardBottomNav from "../Dashboard/DashboardBottomNav";

const ProfileComponent = () => {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const { data: groupsData } = useGroups();
  const groups = groupsData?.groups || [];
  const [activeTab, setActiveTab] = useState<"dashboard" | "trips" | "groups" | "profile">("profile");

  const handleTabChange = (tab: "dashboard" | "trips" | "groups" | "profile") => {
    if (tab === "profile") {
      setActiveTab("profile");
      // Stay on profile page
    } else {
      // Navigate to dashboard with tab query parameter
      router.push(`/dashboard?tab=${tab}`);
    }
  };

  // Calculate statistics
  const totalGroups = groups.length;
  const totalTrips = groups.reduce(
    (acc, group) => acc + (group.trips?.length || 0),
    0
  );

  if (loading) {
    return (
      <main className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600 font-medium'>Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-slate-600 font-medium'>
            Please sign in to view your profile
          </p>
        </div>
      </main>
    );
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const avatarUrl = user.photoURL || null;
  const email = user.email || "";
  const accountCreated = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime)
    : null;

  return (
    <main className='min-h-screen bg-slate-50 pb-36 md:pb-28'>
      <div className='max-w-4xl mx-auto px-4 py-8'>
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className='mb-6 px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900 hover:bg-white/60 backdrop-blur-sm'
        >
          <ArrowLeft className='w-5 h-5' />
          Back to Dashboard
        </button>

        {/* Profile Header Card */}
        <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-8 sm:p-12 mb-6'>
          <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6'>
            {/* Name and Email */}
            <div className='flex-1 text-center sm:text-left'>
              <h1 className='text-3xl sm:text-4xl font-bold text-slate-900 mb-2'>
                {displayName}
              </h1>
              <div className='flex items-center justify-center sm:justify-start gap-2 text-slate-600'>
                <Mail className='w-4 h-4' />
                <span className='text-sm sm:text-base'>{email}</span>
              </div>
            </div>
          </div>

          {/* Info Cards Section */}
          <div className='p-6 sm:p-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Account Information Card */}
              <div className='bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow'>
                <h3 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                  <User className='w-5 h-5 text-orange-500' />
                  Account Information
                </h3>
                <div className='space-y-4'>
                  <div>
                    <p className='text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide'>
                      Email Address
                    </p>
                    <p className='text-sm font-medium text-slate-900 break-all'>
                      {email}
                    </p>
                  </div>
                  {accountCreated && (
                    <div>
                      <p className='text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide'>
                        Member Since
                      </p>
                      <div className='flex items-center gap-2'>
                        <Calendar className='w-4 h-4 text-slate-400' />
                        <p className='text-sm font-medium text-slate-900'>
                          {accountCreated.toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics Card */}
              <div className='bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow'>
                <h3 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                  <Calendar className='w-5 h-5 text-amber-500' />
                  Your Statistics
                </h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-orange-300 transition-colors'>
                    <span className='text-sm font-medium text-slate-600'>
                      Travel Groups
                    </span>
                    <span className='text-2xl font-bold text-amber-600'>
                      {totalGroups}
                    </span>
                  </div>
                  <div className='flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-orange-300 transition-colors'>
                    <span className='text-sm font-medium text-slate-600'>
                      Total Trips
                    </span>
                    <span className='text-2xl font-bold text-orange-600'>
                      {totalTrips}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8'>
          <h3 className='text-lg font-semibold text-slate-900 mb-4'>
            About Your Account
          </h3>
          <div className='space-y-3 text-sm text-slate-600'>
            <p>
              Your profile information is managed through your authentication
              provider. To update your name or profile picture, please update
              your account settings with your authentication provider.
            </p>
          </div>
        </div>
      </div>

      <DashboardBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </main>
  );
};

export default ProfileComponent;
