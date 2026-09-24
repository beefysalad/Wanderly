import { z } from "zod";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// The only folders the app uploads to; arbitrary client-chosen paths are not accepted.
export const UPLOAD_FOLDERS = ["expenses/qr-codes", "users/avatars"] as const;

export const uploadFolderSchema = z.enum(UPLOAD_FOLDERS).default("expenses/qr-codes");
