"use client";

import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useGroups, useJoinGroup } from "@/src/hooks/useGroups";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import Footer from "@/src/app/components/shared/Footer";
import Header from "@/src/app/components/shared/Header";
import NavigationLoader from "@/src/app/components/shared/NavigationLoader";
import { useNavigationLoading } from "@/src/hooks/useNavigationLoading";
import { LogIn, UserPlus, Users } from "lucide-react";

export default function InvitePage({
  params,
}: {
  params: Promise<{ groupCode: string }>;
}) {
  const { groupCode } = use(params);
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const joinGroup = useJoinGroup();
  // Only fetch groups if user is authenticated to avoid 401 errors
  const { data: groupsData } = useGroups(!!user);
  // AuthModal state removed
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [shouldJoinAfterAuth, setShouldJoinAfterAuth] = useState(false);
  const { isNavigating, withNavigation } = useNavigationLoading();

  // Don't auto-open modal - let users see the invite page first
  // They can click the buttons to open the modal when ready

  // Auto-join group if user is authenticated
  useEffect(() => {
    const handleAutoJoin = async () => {
      // If we're waiting for auth, check if user is now available
      if (shouldJoinAfterAuth && user && !userLoading && !isJoining) {
        setIsJoining(true);
        setError(null);
        setShouldJoinAfterAuth(false);

        try {
          await withNavigation(async () => {
            const result = await joinGroup.mutateAsync({
              groupCode: groupCode.toUpperCase(),
            });
            if (result.group) {
              router.push(`/group/${result.group.id}`);
            }
          });
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          const message =
            err?.response?.data?.error ||
            err?.message ||
            "Failed to join group";

          // If user is already a member, find the group and redirect
          if (message.includes("already a member")) {
            // Wait a bit for groups to load if not yet loaded
            if (groupsData?.groups) {
              const existingGroup = groupsData.groups.find(
                (g) => g.code.toUpperCase() === groupCode.toUpperCase(),
              );
              if (existingGroup) {
                router.push(`/group/${existingGroup.id}`);
                return;
              }
            }
            // If groups not loaded yet, show friendly message
            setError(
              "You're already a member of this group. Redirecting to dashboard...",
            );
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
            return;
          }

          // Handle invalid group code
          if (
            message.includes("not found") ||
            message.includes("Group not found")
          ) {
            setError(
              "Invalid invite link. This group may have been deleted or the link is incorrect.",
            );
            return;
          }

          setError(message);
        } finally {
          setIsJoining(false);
        }
        return;
      }

      // Normal flow: user navigated here while already authenticated
      if (
        user &&
        !userLoading &&
        !isJoining &&
        !isJoining &&
        !shouldJoinAfterAuth
      ) {
        setIsJoining(true);
        setError(null);

        try {
          await withNavigation(async () => {
            const result = await joinGroup.mutateAsync({
              groupCode: groupCode.toUpperCase(),
            });
            if (result.group) {
              router.push(`/group/${result.group.id}`);
            }
          });
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          const message =
            err?.response?.data?.error ||
            err?.message ||
            "Failed to join group";

          // If user is already a member, find the group and redirect
          if (message.includes("already a member")) {
            if (groupsData?.groups) {
              const existingGroup = groupsData.groups.find(
                (g) => g.code.toUpperCase() === groupCode.toUpperCase(),
              );
              if (existingGroup) {
                router.push(`/group/${existingGroup.id}`);
                return;
              }
            }
            setError(
              "You're already a member of this group. Redirecting to dashboard...",
            );
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
            return;
          }

          if (
            message.includes("not found") ||
            message.includes("Group not found")
          ) {
            setError(
              "Invalid invite link. This group may have been deleted or the link is incorrect.",
            );
            return;
          }

          setError(message);
        } finally {
          setIsJoining(false);
        }
      }
    };

    handleAutoJoin();
  }, [
    user,
    userLoading,
    isJoining,
    shouldJoinAfterAuth,
    groupCode,
    joinGroup,
    router,
    withNavigation,
    groupsData,
  ]);

  // handleAuthSuccess logic removed as it's no longer needed with page redirection

  if (userLoading || isJoining || isNavigating) {
    return (
      <main className='min-h-screen bg-slate-950 text-white relative flex flex-col'>
        <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
          <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow'></div>
          <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000'></div>
        </div>
        <div className='relative z-10 flex-1 flex flex-col'>
          <Header />
          <div className='flex-1 flex items-center justify-center p-4'>
            <div className='text-center bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 p-8 max-w-md'>
              <div className='w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4'></div>
              <p className='text-slate-300 font-medium'>
                {userLoading
                  ? "Loading..."
                  : isJoining
                    ? "Joining group..."
                    : "Redirecting..."}
              </p>
            </div>
          </div>
          <Footer />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='min-h-screen bg-slate-950 text-white relative flex flex-col'>
        <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
          <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow'></div>
          <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000'></div>
        </div>
        <div className='relative z-10 flex-1 flex flex-col'>
          <Header />
          <div className='flex-1 flex items-center justify-center p-4'>
            <div className='text-center bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 p-6 sm:p-8 max-w-md'>
              <div className='w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30'>
                <span className='text-3xl'>😞</span>
              </div>
              <h2 className='text-xl font-bold text-white mb-2'>Error</h2>
              <p className='text-slate-300 mb-6'>{error}</p>
              <button
                onClick={() => router.push("/dashboard")}
                className='px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl'
              >
                Go to Dashboard
              </button>
            </div>
          </div>
          <Footer />
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-slate-950 text-white relative flex flex-col'>
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000'></div>
      </div>
      <div className='relative z-10 flex-1 flex flex-col'>
        <Header />
        <div className=' flex-1 flex items-center justify-center p-4 py-8'>
          <div className='w-full max-w-2xl'>
            <div className='text-center bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 p-8 sm:p-12'>
              <div className='mb-6'>
                <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl mb-4 shadow-lg'>
                  <Users className='w-10 h-10 text-white' />
                </div>
                <h1 className='text-3xl md:text-4xl font-bold text-white mb-3'>
                  You&apos;ve Been Invited! 🎉
                </h1>
                <p className='text-lg text-slate-300 leading-relaxed mb-2'>
                  A friend has invited you to join their travel group
                </p>
                <p className='text-sm text-slate-400'>
                  Sign in or create an account to accept the invitation and
                  start planning together
                </p>
              </div>

              <div className='flex items-center justify-center gap-2 mb-6 p-4 bg-white/5 rounded-xl border border-white/5'>
                <span className='text-sm text-slate-300'>
                  Group Code:{" "}
                  <span className='font-mono font-bold text-amber-400'>
                    {groupCode.toUpperCase()}
                  </span>
                </span>
              </div>

              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <button
                  onClick={() => {
                    router.push(
                      `/register?redirect=${encodeURIComponent(
                        `/invite/${groupCode}`,
                      )}`,
                    );
                  }}
                  className='px-8 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_100%] hover:bg-[length:100%_100%] rounded-lg font-semibold transition-all duration-500 flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/60 text-sm overflow-hidden group animate-gradient-shift'
                >
                  <UserPlus className='w-4 h-4' />
                  <span>Sign Up to Join</span>
                </button>
                <button
                  onClick={() => {
                    router.push(
                      `/login?redirect=${encodeURIComponent(
                        `/invite/${groupCode}`,
                      )}`,
                    );
                  }}
                  className='px-8 py-3 bg-transparent hover:bg-orange-600/10 border-2 border-orange-500 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 text-sm shadow-lg hover:shadow-orange-500/50'
                >
                  <LogIn className='w-4 h-4' />
                  <span>Sign In</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {isNavigating && <NavigationLoader message='Redirecting...' />}
    </main>
  );
}
