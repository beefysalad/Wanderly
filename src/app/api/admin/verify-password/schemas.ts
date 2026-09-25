import { z } from "zod";

// A missing password is treated as an invalid one (401), not a malformed request.
export const verifyPasswordSchema = z.object({
  password: z.string().nullish(),
});
