import z from "zod";

export const createGroupSchema = z.object({
  groupName: z.string().min(5, "Group name must be at least 5 characters"),
});
export type TCreateGroupSchema = z.infer<typeof createGroupSchema>;
