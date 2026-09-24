import { z } from "zod";

export const MAX_NOTIFICATIONS_PAGE_SIZE = 100;

export const listNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_NOTIFICATIONS_PAGE_SIZE).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  read: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
