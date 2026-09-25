import { z } from "zod";

const memberTaskStatusSchema = z.enum(["not_started", "in_progress", "done"]);

// `null` must be tried before `z.coerce.date()` — coercing `null` through
// `new Date(null)` silently succeeds (epoch), so putting date first in the
// union would swallow explicit null-clearing instead of matching it.
const dueDateSchema = z.union([z.null(), z.coerce.date()]).optional();

export const createMemberTaskSchema = z.object({
  assignedToId: z.string().min(1, "assignedToId is required"),
  title: z.string().trim().min(1, "title is required"),
  notes: z.string().nullable().optional(),
  dueDate: dueDateSchema,
  status: memberTaskStatusSchema.optional(),
});
export type CreateMemberTaskBody = z.infer<typeof createMemberTaskSchema>;

export const updateMemberTaskSchema = z.object({
  assignedToId: z.string().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  notes: z.string().nullable().optional(),
  dueDate: dueDateSchema,
  status: memberTaskStatusSchema.optional(),
});
export type UpdateMemberTaskBody = z.infer<typeof updateMemberTaskSchema>;
