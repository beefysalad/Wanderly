import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import api from "@/lib/axios";
import type { User } from "@/src/shared/types";
import type { Step } from "./onboardingOptions";
import { buildProfileUpdates } from "./onboardingProfile";
import { canContinue, nextStep, previousStep, savesProfile } from "./onboardingSteps";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function useOnboardingWizard(user: User, onComplete: () => void) {
  const [step, setStep] = useState<Step>("WELCOME");

  // Identity State
  const [displayName, setDisplayName] = useState(user.name || "");
  const [imageUrl, setImageUrl] = useState(user.imageUrl || user.avatar || "");
  const [bucketList, setBucketList] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Preference State
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError("Image size must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "users/avatars");

      const response = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setImageUrl(response.data.url);
    } catch (error) {
      console.error("Failed to upload image", error);
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleVibe = (id: string) => {
    setSelectedVibes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const handleUpdateProfile = async (nextStep: Step) => {
    try {
      setIsSubmitting(true);

      const updates = buildProfileUpdates(user.bio || "", {
        displayName,
        imageUrl,
        bucketList,
        selectedVibes,
        selectedCrew,
      });

      if (Object.keys(updates).length > 0) {
        await api.patch("/user/profile", updates);
        queryClient.invalidateQueries({ queryKey: ["user"] });
      }

      setStep(nextStep);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteOnboarding = async (
    nextAction?: "CREATE_GROUP" | "JOIN_GROUP",
  ) => {
    try {
      setIsSubmitting(true);
      await api.patch("/user/profile", {
        hasCompletedOnboarding: true,
      });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["current-user-db"] });

      if (nextAction === "CREATE_GROUP") {
        router.push("/group/create");
      } else if (nextAction === "JOIN_GROUP") {
        router.push("/group/join");
      } else {
        onComplete();
      }
    } catch (error) {
      console.error("Failed to complete onboarding", error);
      setIsSubmitting(false);
    }
  };

  // The bottom bar's Continue and Back: answers are saved on the way forward, never on the way back.
  const proceed = () => {
    const next = nextStep(step);
    if (!next) return;
    if (savesProfile(step)) void handleUpdateProfile(next);
    else setStep(next);
  };

  const goBack = () => {
    const previous = previousStep(step);
    if (previous) setStep(previous);
  };

  const continueEnabled = canContinue(step, {
    isUploading,
    isSubmitting,
    vibeCount: selectedVibes.length,
    crew: selectedCrew,
  });

  return {
    step,
    setStep,
    proceed,
    goBack,
    continueEnabled,
    displayName,
    imageUrl,
    bucketList,
    setBucketList,
    uploadError,
    isUploading,
    selectedVibes,
    selectedCrew,
    setSelectedCrew,
    isSubmitting,
    fileInputRef,
    handleImageUpload,
    toggleVibe,
    handleUpdateProfile,
    handleCompleteOnboarding,
  };
}
