import { useMemo } from "react";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useGroups } from "@/src/hooks/useGroups";
import { useCurrentUserDB } from "@/src/hooks/useProfile";
import { AppShell } from "../../shared/AppShell/AppShell";
import LoadingState from "../../shared/LoadingState";
import WhatsNewModal from "../../shared/Modal/WhatsNewModal";
import { allTrips, upcomingTrips } from "../../shared/tripDates";
import { DashboardHeader } from "./DashboardHeader";
import { NextTripCard } from "./NextTripCard";
import OnboardingWizard from "./OnboardingWizard";
import { StatsStrip } from "./StatsStrip";
import { TripCalendar } from "./TripCalendar";
import { useDashboardEffects } from "./useDashboardEffects";
import { YourGroups } from "./YourGroups";

const DashboardComponent = () => {
  const { user } = useCurrentUser();
  const { data: groupsData, isLoading } = useGroups();
  const { data: dbUser } = useCurrentUserDB();
  const whatsNew = useDashboardEffects(user);

  // "Today" is fixed for the visit so the calendar and countdowns agree with each other.
  const today = useMemo(() => new Date(), []);

  const groups = useMemo(
    () =>
      [...(groupsData?.groups ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [groupsData],
  );
  const trips = useMemo(() => allTrips(groups), [groups]);
  const upcoming = useMemo(() => upcomingTrips(trips, today), [trips, today]);

  if (dbUser && dbUser.hasCompletedOnboarding === false) {
    return <OnboardingWizard user={dbUser} onComplete={() => {}} />;
  }

  const fullName: string = dbUser?.name || user?.displayName || "Traveler";
  const firstName = fullName.trim().split(" ")[0] || "Traveler";

  return (
    <AppShell>
      {isLoading ? (
        <LoadingState className="py-24" />
      ) : (
        <div className='flex flex-col gap-[26px]'>
          <DashboardHeader firstName={firstName} today={today} />

          <div className='flex flex-wrap items-start gap-6'>
            <div className='flex min-w-0 flex-[999_1_500px] flex-col gap-6'>
              {upcoming[0] ? <NextTripCard trip={upcoming[0]} today={today} /> : null}
              <StatsStrip
                stats={[
                  { label: "Groups", value: groups.length },
                  { label: "Trips", value: trips.length },
                  { label: "Upcoming", value: upcoming.length },
                ]}
              />
              {groups.length > 0 ? (
                <YourGroups groups={groups.slice(0, 3)} total={groups.length} />
              ) : (
                <div className='rounded-[22px] border border-dashed border-white/[.14] bg-[rgba(15,23,42,.4)] p-10 text-center'>
                  <h2 className='mb-2 text-xl font-bold'>Start your journey</h2>
                  <p className='mx-auto max-w-md text-[#94a3b8]'>
                    You haven&apos;t joined any groups yet. Create one to start planning, or ask a friend for their
                    invite code.
                  </p>
                </div>
              )}
            </div>
            <div className='min-w-0 flex-[1_1_300px]'>
              <TripCalendar trips={trips} upcoming={upcoming} today={today} />
            </div>
          </div>
        </div>
      )}

      {whatsNew.show ? <WhatsNewModal onClose={whatsNew.close} features={whatsNew.features} /> : null}
    </AppShell>
  );
};

export default DashboardComponent;
