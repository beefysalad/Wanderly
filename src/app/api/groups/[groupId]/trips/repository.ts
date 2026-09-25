import prisma from "@/lib/prisma";
import type { Prisma, TripStatus } from "@prisma/client";

const TRIP_DETAIL_INCLUDE = {
  activities: true,
  creator: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TripInclude;

export function findTripById(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, groupId: true, name: true, createdById: true },
  });
}

export interface CreateTripRow {
  groupId: string;
  createdById: string;
  name: string;
  startDate: Date;
  endDate: Date;
  location: string | null;
  status: TripStatus;
}

export function createTripRow(data: CreateTripRow) {
  return prisma.trip.create({ data, include: TRIP_DETAIL_INCLUDE });
}

export interface UpdateTripRow {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string | null;
  status?: TripStatus;
}

export function updateTripRow(tripId: string, data: UpdateTripRow) {
  return prisma.trip.update({
    where: { id: tripId },
    data,
    include: TRIP_DETAIL_INCLUDE,
  });
}

export function deleteTripRow(tripId: string) {
  return prisma.trip.delete({ where: { id: tripId } });
}
