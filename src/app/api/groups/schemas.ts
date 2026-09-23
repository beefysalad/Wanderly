import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(5, "Group name must be at least 5 characters"),
  colorScheme: z.string().default("orange"),
  emoji: z.string().nullable().default(null),
});
export type CreateGroupBody = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z
  .object({
    name: z.string().trim().min(5, "Group name must be at least 5 characters").optional(),
    colorScheme: z.string().optional(),
    emoji: z.string().nullable().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.colorScheme !== undefined ||
      data.emoji !== undefined,
    { message: "At least one field (name, colorScheme, or emoji) must be provided" },
  );
export type UpdateGroupBody = z.infer<typeof updateGroupSchema>;

export const joinGroupSchema = z.object({
  groupCode: z.string().trim().min(1, "Group code is required"),
});
export type JoinGroupBody = z.infer<typeof joinGroupSchema>;

export const validateCodeSchema = z.object({
  code: z.string().trim().min(1, "Group code is required"),
});
export type ValidateCodeBody = z.infer<typeof validateCodeSchema>;
