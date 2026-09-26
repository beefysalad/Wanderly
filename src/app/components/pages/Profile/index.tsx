"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { auth } from "@/lib/firebase";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useGroups } from "@/src/hooks/useGroups";
import { useProfileImageUpload } from "@/src/hooks/useProfileImageUpload";
import {
  useCurrentUserDB,
  useUpdatePassword,
  useUpdateProfile,
} from "@/src/hooks/useProfile";
import {
  editProfileSchema,
  TEditProfileSchema,
} from "../../shared/Modal/EditProfileModal/editProfileZod";
import { AppShell } from "../../shared/AppShell/AppShell";
import { StateCard } from "../../shared/AppShell/StateCard";
import LoadingState from "../../shared/LoadingState";
import { parseProfileBio } from "../Dashboard/OnboardingWizard/onboardingProfile";
import { vibesOf } from "./profileView";
import { RecentJourneys } from "./components/RecentJourneys";
import { TravelDna } from "./components/TravelDna";
import { ProfileEditForm } from "./components/ProfileEditForm";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileStats } from "./components/ProfileStats";

const ProfileComponent = () => {
  const router = useRouter();
  const { user: firebaseUser, loading: firebaseLoading } = useCurrentUser();
  const { data: userDB, isLoading: dbLoading } = useCurrentUserDB();
  const { data: groupsData } = useGroups();
  const groups = groupsData?.groups || [];

  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const updateProfileMutation = useUpdateProfile();
  const updatePasswordMutation = useUpdatePassword();
  const {
    fileInputRef,
    photoPreview,
    uploadedPhotoURL,
    uploadingImage,
    uploadError,
    setUploadError,
    handleImageUpload,
    resetUpload,
  } = useProfileImageUpload();

  const form = useForm<TEditProfileSchema>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: userDB?.name || firebaseUser?.displayName || "",
      photo: null,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      bio: userDB?.bio || "",
      travelStyle: userDB?.travelStyle || "",
    },
  });

  useEffect(() => {
    if (userDB || firebaseUser) {
      form.reset({
        name: userDB?.name || firebaseUser?.displayName || "",
        photo: null,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        bio: userDB?.bio || "",
        travelStyle: userDB?.travelStyle || "",
      });
      resetUpload(userDB?.imageUrl || firebaseUser?.photoURL || null);
      setShowPasswordSection(false);
    }
  }, [userDB, firebaseUser, isEditMode, form, resetUpload]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const onSubmit = async (values: TEditProfileSchema) => {
    try {
      setError(null);
      setUploadError(null);

      const profileUpdates: {
        name?: string;
        photoURL?: string;
        bio?: string;
        travelStyle?: string;
      } = {};

      if (values.name && values.name !== (userDB?.name || firebaseUser?.displayName)) {
        profileUpdates.name = values.name;
      }
      if (uploadedPhotoURL) {
        profileUpdates.photoURL = uploadedPhotoURL;
      }
      if (values.bio !== userDB?.bio) {
        profileUpdates.bio = values.bio;
      }
      if (values.travelStyle !== userDB?.travelStyle) {
        profileUpdates.travelStyle = values.travelStyle;
      }

      if (Object.keys(profileUpdates).length > 0) {
        await updateProfileMutation.mutateAsync(profileUpdates);
      }

      if (values.newPassword && values.newPassword.length > 0 && values.currentPassword) {
        await updatePasswordMutation.mutateAsync({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
      }

      setIsEditMode(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setError(null);
    setShowPasswordSection(false);
    form.reset();
    resetUpload(userDB?.imageUrl || firebaseUser?.photoURL || null);
  };

  if (firebaseLoading || dbLoading) {
    return (
      <AppShell level='top'>
        <LoadingState />
      </AppShell>
    );
  }

  if (!firebaseUser) {
    return (
      <StateCard
        back={{ href: "/", crumb: "Home" }}
        title='Please sign in to view your profile'
        actionLabel='Login'
        onAction={() => router.push("/login")}
      />
    );
  }

  const displayName =
    userDB?.name || firebaseUser?.displayName || firebaseUser?.email?.split("@")[0] || "Traveler";
  const avatarUrl = photoPreview || userDB?.imageUrl || firebaseUser?.photoURL || null;
  const email = firebaseUser?.email || "";
  const { about, bucketList, crew } = parseProfileBio(userDB?.bio);

  return (
    <AppShell level='top'>
      <div className='flex flex-col gap-6'>
        <ProfileHeader
          displayName={displayName}
          email={email}
          about={about}
          avatarUrl={avatarUrl}
          isEditMode={isEditMode}
          uploadingImage={uploadingImage}
          fileInputRef={fileInputRef}
          onFileChange={handleImageUpload}
          onEditClick={() => setIsEditMode(true)}
        />

        {(error || uploadError) && (
          <div className='flex flex-col gap-2'>
            {error && (
              <div className='rounded-xl border border-[rgba(248,113,113,.3)] bg-[rgba(248,113,113,.08)] px-4 py-3 text-sm text-[#fecaca]'>
                {error}
              </div>
            )}
            {uploadError && (
              <div className='rounded-xl border border-[rgba(245,158,11,.3)] bg-[rgba(245,158,11,.08)] px-4 py-3 text-sm text-[#fde68a]'>
                {uploadError}
              </div>
            )}
          </div>
        )}

        {isEditMode ? (
          <ProfileEditForm
            form={form}
            onSubmit={onSubmit}
            onCancel={handleCancel}
            isSubmitting={updateProfileMutation.isPending}
            showPasswordSection={showPasswordSection}
            onTogglePasswordSection={() => setShowPasswordSection(!showPasswordSection)}
          />
        ) : (
          <>
            <ProfileStats groups={groups} />
            <div className='flex flex-wrap items-start gap-6'>
              <RecentJourneys groups={groups} />
              <TravelDna
                vibes={vibesOf(userDB?.travelStyle)}
                crew={crew}
                bucketList={bucketList}
                onSignOut={handleLogout}
              />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default ProfileComponent;
