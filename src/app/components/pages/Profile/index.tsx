"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "firebase/auth";
import { Edit, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import PremiumPageHeader from "../../shared/PremiumPageHeader";
import LoadingState from "../../shared/LoadingState";
import DashboardBottomNav from "../Dashboard/DashboardBottomNav";
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
      <main className='min-h-screen bg-slate-950 p-6'>
        <LoadingState fullScreen />
      </main>
    );
  }

  if (!firebaseUser) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center px-4'>
        <div className='text-center max-w-md'>
          <div className='w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10'>
            <User className='w-10 h-10 text-slate-400' />
          </div>
          <p className='text-slate-400 font-medium text-lg'>
            Please sign in to view your profile
          </p>
          <Button
            onClick={() => router.push("/login")}
            className='mt-4 bg-orange-500 hover:bg-orange-600'
          >
            Login
          </Button>
        </div>
      </main>
    );
  }

  const displayName =
    userDB?.name || firebaseUser?.displayName || firebaseUser?.email?.split("@")[0] || "Traveler";
  const avatarUrl = photoPreview || userDB?.imageUrl || firebaseUser?.photoURL || null;
  const email = firebaseUser?.email || "";
  const memberSince = userDB?.createdAt ? new Date(userDB.createdAt) : new Date();

  return (
    <main className='min-h-screen bg-slate-950 pb-24 text-slate-200 overflow-x-hidden font-sans'>
      <PremiumPageHeader
        title='My Profile'
        onBack={() => router.push("/dashboard")}
        actions={
          !isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className='flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90'
              title='Edit Profile'
            >
              <Edit className='w-5 h-5' />
            </button>
          )
        }
      />

      <div className='max-w-4xl mx-auto px-6 pt-8 sm:pt-12 pb-8'>
        <ProfileHeader
          displayName={displayName}
          email={email}
          memberSince={memberSince}
          avatarUrl={avatarUrl}
          travelStyle={userDB?.travelStyle}
          bio={userDB?.bio}
          isEditMode={isEditMode}
          uploadingImage={uploadingImage}
          fileInputRef={fileInputRef}
          onFileChange={handleImageUpload}
          onAvatarButtonClick={() => {
            if (isEditMode && !uploadingImage) {
              fileInputRef.current?.click();
            } else if (!isEditMode) {
              setIsEditMode(true);
            }
          }}
          onEditClick={() => setIsEditMode(true)}
          onLogout={handleLogout}
        />

        {(error || uploadError) && (
          <div className='mb-6 space-y-2'>
            {error && (
              <div className='rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200'>
                {error}
              </div>
            )}
            {uploadError && (
              <div className='rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100'>
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
          <ProfileStats groups={groups} />
        )}
      </div>

      <DashboardBottomNav />
    </main>
  );
};

export default ProfileComponent;
