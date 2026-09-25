import { NotFoundError } from "@/lib/errors";
import type { DecodedIdToken } from "firebase-admin/auth";
import { verifyTripAccess } from "../../../access";
import { generateICSContent } from "./ics";
import { findTripWithActivities } from "./repository";

export async function exportTripIcsService(token: DecodedIdToken, tripId: string) {
  await verifyTripAccess(token, tripId);

  const trip = await findTripWithActivities(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  return {
    content: generateICSContent(trip, trip.activities),
    fileName: `${trip.name.replace(/[^a-z0-9]/gi, "_")}_schedule.ics`,
  };
}
