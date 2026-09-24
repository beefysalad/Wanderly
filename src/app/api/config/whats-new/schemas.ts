import { z } from "zod";

const featureSchema = z.object({
  icon: z.string(),
  title: z.string(),
  description: z.string(),
  color: z.string(),
  bg: z.string(),
});

export const whatsNewConfigSchema = z.object({
  version: z.string().min(1, "Version is required"),
  features: z.array(featureSchema),
});
export type WhatsNewConfigBody = z.infer<typeof whatsNewConfigSchema>;
