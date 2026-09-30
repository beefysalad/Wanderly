import { z } from "zod";

const MAX_IMAGE_URL_LENGTH = 2048;

// Cloudinary (our own uploads) and Google (avatars from Firebase/Google sign-in).
const ALLOWED_IMAGE_HOSTS = new Set(["res.cloudinary.com", "lh3.googleusercontent.com"]);

/** Empty string means "no image" and is left to the field's own required/optional handling. */
export function isAllowedImageUrl(value: string): boolean {
  if (value === "") return true;
  if (value.length > MAX_IMAGE_URL_LENGTH) return false;

  try {
    return ALLOWED_IMAGE_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

/** A Zod field for a user-supplied image URL: must be empty, or point at Cloudinary or Google. */
export const imageUrlSchema = z
  .string()
  .refine(isAllowedImageUrl, "Image URL must be hosted on Cloudinary or Google");
