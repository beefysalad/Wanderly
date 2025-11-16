import z from "zod";

const colorSchemeOptions = [
  "orange",
  "blue",
  "green",
  "purple",
  "pink",
  "red",
  "amber",
  "emerald",
  "indigo",
  "cyan",
] as const;

export const editGroupSchema = z.object({
  groupName: z.string().min(5, "Group name must be at least 5 characters"),
  colorScheme: z.enum(colorSchemeOptions),
  emoji: z.string().optional().nullable(),
});
export type TEditGroupSchema = z.input<typeof editGroupSchema>;

