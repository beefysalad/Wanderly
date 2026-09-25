import { z } from "zod";

export const maintenanceSchema = z.object({
  action: z.enum(["clean-test-data"]),
});
export type MaintenanceBody = z.infer<typeof maintenanceSchema>;
