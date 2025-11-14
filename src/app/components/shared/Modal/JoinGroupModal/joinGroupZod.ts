import z from "zod";

export const joinGroupSchema = z.object({
  groupName: z.string().min(5, "Group name must be at least 5 characters"),
});
export type TJoinGroupSchema = z.infer<typeof joinGroupSchema>;
