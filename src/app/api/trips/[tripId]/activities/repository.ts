import prisma from "@/lib/prisma";

export function findActivityById(activityId: string) {
  return prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, tripId: true, title: true },
  });
}

export interface CreateActivityRow {
  tripId: string;
  title: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  transportationMode: string | null;
  pickupTime: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
}

export function createActivityRow(data: CreateActivityRow) {
  return prisma.activity.create({ data: { ...data, done: false } });
}

export interface UpdateActivityRow {
  title?: string;
  date?: Date;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  done?: boolean;
  transportationMode?: string | null;
  pickupTime?: string | null;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
}

export function updateActivityRow(activityId: string, data: UpdateActivityRow) {
  return prisma.activity.update({ where: { id: activityId }, data });
}

export function deleteActivityRow(activityId: string) {
  return prisma.activity.delete({ where: { id: activityId } });
}
