"use client";

import { useMemo } from "react";
import { useGroups } from "@/src/hooks/useGroups";
import { AppShell } from "../../shared/AppShell/AppShell";
import { PageHeading } from "../../shared/AppShell/PageHeading";
import LoadingState from "../../shared/LoadingState";
import { PillLink } from "../../shared/Pills";
import { allTrips, pastTrips, upcomingTrips } from "../../shared/tripDates";
import { TripRow } from "./TripRow";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-[10px]'>
      <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>{label}</span>
      {children}
    </div>
  );
}

const TripsComponent = () => {
  const { data, isLoading } = useGroups();
  const today = useMemo(() => new Date(), []);

  const groups = useMemo(() => data?.groups ?? [], [data]);
  const trips = useMemo(() => allTrips(groups), [groups]);
  const upcoming = useMemo(() => upcomingTrips(trips, today), [trips, today]);
  const past = useMemo(() => pastTrips(trips, today), [trips, today]);
  // A cancelled trip that hasn't happened yet still deserves a row, so it is listed with the upcoming ones.
  const cancelled = useMemo(
    () => trips.filter((trip) => trip.status === "cancelled" && !past.includes(trip) && !upcoming.includes(trip)),
    [trips, past, upcoming],
  );
  const upcomingAll = [...upcoming, ...cancelled];

  return (
    <AppShell>
      <div className='flex flex-col gap-[26px]'>
        <PageHeading eyebrow={`Across ${groups.length} ${groups.length === 1 ? "group" : "groups"}`} title='Trips' />

        {isLoading ? <LoadingState className='py-24' /> : null}

        {!isLoading && trips.length === 0 ? (
          <div className='rounded-[22px] border border-dashed border-white/[.14] bg-[rgba(15,23,42,.4)] p-10 text-center'>
            <h2 className='mb-2 text-xl font-bold'>No trips yet</h2>
            <p className='mx-auto mb-5 max-w-md text-[#94a3b8]'>
              Create or join a group, then plan a trip inside it. Everyone in the group sees it the moment you save.
            </p>
            <div className='flex flex-wrap justify-center gap-[10px]'>
              <PillLink href='/group/create'>Create group</PillLink>
              <PillLink href='/group/join' variant='ghost'>
                Join with code
              </PillLink>
            </div>
          </div>
        ) : null}

        {upcomingAll.length > 0 ? (
          <Section label='Upcoming'>
            {upcomingAll.map((trip) => (
              <TripRow key={`${trip.groupId}-${trip.id}`} trip={trip} today={today} />
            ))}
          </Section>
        ) : null}

        {past.length > 0 ? (
          <Section label='Past'>
            {past.map((trip) => (
              <TripRow key={`${trip.groupId}-${trip.id}`} trip={trip} today={today} />
            ))}
          </Section>
        ) : null}
      </div>
    </AppShell>
  );
};

export default TripsComponent;
