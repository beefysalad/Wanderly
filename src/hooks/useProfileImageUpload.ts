"use client";
import { useCallback, useRef, useState } from "react";
import api from "@/lib/axios";
import { logger } from "@/lib/logger";

export function useProfileImageUpload() {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedPhotoURL, setUploadedPhotoURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setUploadError("File must be an image");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError("File size must be less than 5MB");
        return;
      }

      setUploadingImage(true);
      setUploadError(null);

      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "users/avatars");

        const response = await api.post<{ url: string; publicId: string }>(
          "/upload/image",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );

        setUploadedPhotoURL(response.data.url);
      } catch (error: unknown) {
        logger.error("Failed to upload image", error);
        setUploadError("Failed to upload image. Please try again.");
      } finally {
        setUploadingImage(false);
      }
    },
    [],
  );

  const resetUpload = useCallback((initialPreview: string | null) => {
    setPhotoPreview(initialPreview);
    setUploadedPhotoURL(null);
    setUploadError(null);
  }, []);

  return {
    fileInputRef,
    photoPreview,
    setPhotoPreview,
    uploadedPhotoURL,
    uploadingImage,
    uploadError,
    setUploadError,
    handleImageUpload,
    resetUpload,
  };
}
