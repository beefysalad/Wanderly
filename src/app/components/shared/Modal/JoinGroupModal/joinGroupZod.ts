import z from "zod";

export const joinGroupSchema = z.object({
  groupCode: z.string().min(5, "Group code must be at least 5 characters"),
});
export type TJoinGroupSchema = z.infer<typeof joinGroupSchema>;
