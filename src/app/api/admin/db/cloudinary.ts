import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryResourceUsage {
  usage?: number;
  limit?: number;
}

export interface CloudinaryUsage {
  plan?: string;
  resources?: CloudinaryResourceUsage;
  bandwidth?: CloudinaryResourceUsage;
  objects?: CloudinaryResourceUsage;
}

/** Account usage from the Cloudinary Admin API; the only place that calls it. */
export function fetchCloudinaryUsage(): Promise<CloudinaryUsage> {
  return cloudinary.api.usage();
}
