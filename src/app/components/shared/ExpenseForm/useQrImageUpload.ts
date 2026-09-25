import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import api from "@/lib/axios";
import type { TExpenseSchema } from "./expenseSchema";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function useQrImageUpload(form: UseFormReturn<TExpenseSchema>) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("File must be an image");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<{ url: string; publicId: string }>(
        "/upload/image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      form.setValue("qrImage", response.data.url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to upload image:", error);
      setUploadError(error.response?.data?.error || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  return { uploadingImage, uploadError, handleImageUpload };
}
