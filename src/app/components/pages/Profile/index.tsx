"use client";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useGroups } from "@/src/hooks/useGroups";
import {
  ArrowLeft,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const ProfileComponent = () => {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const { data: groupsData } = useGroups();
  const groups = groupsData?.groups || [];

  // Calculate statistics
  const totalGroups = groups.length;
  const totalTrips = groups.reduce(
    (acc, group) => acc + (group.trips?.length || 0),
    0
  );

  if (loading) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600 font-medium'>Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex items-center justify-center'>
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
  const emailVerified = user.emailVerified || false;
  const accountCreated = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime)
    : null;

  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20'>
      <div className='max-w-4xl mx-auto px-4 py-8'>
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className='mb-6 px-3 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 font-medium'
        >
          <ArrowLeft className='w-5 h-5' />
          Back to Dashboard
        </button>

        {/* Profile Header Card */}
        <div className='bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6'>
          {/* Gradient Header */}
          <div className='bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 p-8 sm:p-12'>
            <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6'>
              {/* Avatar */}
              <div className='relative'>
                {avatarUrl ? (
                  <div className='w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white'>
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      width={128}
                      height={128}
                      className='w-full h-full object-cover'
                    />
                  </div>
                ) : (
                  <div className='w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center'>
                    <User className='w-12 h-12 sm:w-16 sm:h-16 text-white' />
                  </div>
                )}
              </div>

              {/* Name and Email */}
              <div className='flex-1 text-center sm:text-left'>
                <h1 className='text-3xl sm:text-4xl font-bold text-white mb-2'>
                  {displayName}
                </h1>
                <div className='flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4'>
                  <div className='flex items-center gap-2 text-amber-50'>
                    <Mail className='w-4 h-4' />
                    <span className='text-sm sm:text-base'>{email}</span>
                  </div>
                  {emailVerified ? (
                    <div className='flex items-center gap-2 text-orange-200 bg-orange-500/20 px-3 py-1 rounded-full'>
                      <CheckCircle2 className='w-4 h-4' />
                      <span className='text-xs sm:text-sm font-medium'>
                        Verified
                      </span>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2 text-amber-200 bg-amber-500/20 px-3 py-1 rounded-full'>
                      <XCircle className='w-4 h-4' />
                      <span className='text-xs sm:text-sm font-medium'>
                        Unverified
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards Section */}
          <div className='p-6 sm:p-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Account Information Card */}
              <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
                <h3 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                  <User className='w-5 h-5 text-amber-500' />
                  Account Information
                </h3>
                <div className='space-y-3'>
                  <div>
                    <p className='text-xs text-slate-500 mb-1'>Email Address</p>
                    <p className='text-sm font-medium text-slate-900'>
                      {email}
                    </p>
                  </div>
                  {accountCreated && (
                    <div>
                      <p className='text-xs text-slate-500 mb-1'>
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
                  <div>
                    <p className='text-xs text-slate-500 mb-1'>Email Status</p>
                    <div className='flex items-center gap-2'>
                      {emailVerified ? (
                        <>
                          <CheckCircle2 className='w-4 h-4 text-orange-500' />
                          <p className='text-sm font-medium text-orange-600'>
                            Verified
                          </p>
                        </>
                      ) : (
                        <>
                          <XCircle className='w-4 h-4 text-amber-500' />
                          <p className='text-sm font-medium text-amber-600'>
                            Not Verified
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Card */}
              <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
                <h3 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                  <Calendar className='w-5 h-5 text-orange-500' />
                  Your Statistics
                </h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200'>
                    <span className='text-sm text-slate-600'>
                      Travel Groups
                    </span>
                    <span className='text-2xl font-bold text-amber-600'>
                      {totalGroups}
                    </span>
                  </div>
                  <div className='flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200'>
                    <span className='text-sm text-slate-600'>Total Trips</span>
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
            {!emailVerified && (
              <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4'>
                <p className='text-sm text-amber-800'>
                  <strong>Email Verification:</strong> Your email address has
                  not been verified. Please check your inbox for a verification
                  email.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProfileComponent;
