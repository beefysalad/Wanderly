import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { uploadImageBuffer } from "./cloudinary";
import { MAX_IMAGE_BYTES } from "./schemas";

export async function uploadImageService(file: File, folder: string, userId?: string) {
  if (!file.type.startsWith("image/")) {
    throw new ValidationError("File must be an image");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new ValidationError("File size must be less than 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadImageBuffer(buffer, folder);

  logger.info("Image uploaded to Cloudinary", { publicId: result.public_id, userId });

  return { url: result.secure_url, publicId: result.public_id };
}
