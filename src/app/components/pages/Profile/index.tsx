"use client";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useGroups } from "@/src/hooks/useGroups";
import {
  ArrowLeft,
  Mail,
  Calendar,
  User,
  Edit,
  Save,
  X,
  Camera,
  Lock,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import DashboardBottomNav from "../Dashboard/DashboardBottomNav";
import { useForm } from "react-hook-form";
import { editProfileSchema, TEditProfileSchema } from "../../shared/Modal/EditProfileModal/editProfileZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUpdateProfile, useUpdatePassword } from "@/src/hooks/useProfile";
import api from "@/lib/axios";
import { auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";

const ProfileComponent = () => {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const { data: groupsData } = useGroups();
  const groups = groupsData?.groups || [];
  const [activeTab, setActiveTab] = useState<"dashboard" | "trips" | "groups" | "profile">("profile");
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedPhotoURL, setUploadedPhotoURL] = useState<string | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfileMutation = useUpdateProfile();
  const updatePasswordMutation = useUpdatePassword();

  const form = useForm<TEditProfileSchema>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user?.displayName || "",
      photo: null,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form when user changes or edit mode toggles
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.displayName || "",
        photo: null,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPhotoPreview(user.photoURL || null);
      setUploadedPhotoURL(null);
      setShowPasswordSection(false);
    }
  }, [user, form, isEditMode]);

  const handleTabChange = (tab: "dashboard" | "trips" | "groups" | "profile") => {
    if (tab === "profile") {
      setActiveTab("profile");
      // Stay on profile page
    } else {
      // Navigate to dashboard with tab query parameter
      router.push(`/dashboard?tab=${tab}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("File must be an image");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<{ url: string; publicId: string }>(
        "/upload/image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Set the photo in form and store the uploaded URL
      form.setValue("photo", file);
      setUploadedPhotoURL(response.data.url);
    } catch (error: unknown) {
      console.error("Failed to upload image:", error);
      setUploadError(
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to upload image. Please try again."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (values: TEditProfileSchema) => {
    try {
      setError(null);
      setUploadError(null);

      // Update profile (name and photo)
      const profileUpdates: { name?: string; photoURL?: string } = {};

      if (values.name && values.name !== user?.displayName) {
        profileUpdates.name = values.name;
      }

      // If photo was uploaded, use the stored URL
      if (uploadedPhotoURL) {
        profileUpdates.photoURL = uploadedPhotoURL;
      }

      // Update profile if there are changes
      if (Object.keys(profileUpdates).length > 0) {
        await updateProfileMutation.mutateAsync(profileUpdates);
        
        // Also update client-side Firebase Auth for immediate UI updates
        if (auth.currentUser) {
          const clientUpdates: { displayName?: string; photoURL?: string } = {};
          if (profileUpdates.name) {
            clientUpdates.displayName = profileUpdates.name;
          }
          if (profileUpdates.photoURL) {
            clientUpdates.photoURL = profileUpdates.photoURL;
          }
          if (Object.keys(clientUpdates).length > 0) {
            await updateProfile(auth.currentUser, clientUpdates);
          }
        }
      }

      // Update password if provided
      if (
        values.newPassword &&
        values.newPassword.length > 0 &&
        values.currentPassword
      ) {
        await updatePasswordMutation.mutateAsync({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
      }

      // Exit edit mode after successful update
      setIsEditMode(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setError(null);
    setUploadError(null);
    setShowPasswordSection(false);
    // Reset form to original values
    if (user) {
      form.reset({
        name: user.displayName || "",
        photo: null,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPhotoPreview(user.photoURL || null);
      setUploadedPhotoURL(null);
    }
  };

  // Calculate statistics
  const totalGroups = groups.length;
  const totalTrips = groups.reduce(
    (acc, group) => acc + (group.trips?.length || 0),
    0
  );

  if (loading) {
    return (
      <main className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600 font-medium'>Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-slate-600 font-medium'>
            Please sign in to view your profile
          </p>
        </div>
      </main>
    );
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const avatarUrl = photoPreview || user.photoURL || null;
  const email = user.email || "";
  const accountCreated = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime)
    : null;

  const isPending = updateProfileMutation.isPending || updatePasswordMutation.isPending;

  return (
    <main className='min-h-screen bg-slate-50 pb-36 md:pb-28'>
      <div className='max-w-4xl mx-auto px-4 py-8'>
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className='mb-6 px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900 hover:bg-white/60 backdrop-blur-sm'
        >
          <ArrowLeft className='w-5 h-5' />
          Back to Dashboard
        </button>

        {/* Profile Header Card */}
        <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-8 sm:p-12 mb-6'>
          {!isEditMode ? (
            // View Mode
            <>
              <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6'>
                {/* Avatar */}
                {avatarUrl ? (
                  <div className='relative w-24 h-24 rounded-full overflow-hidden border-4 border-orange-200 shadow-lg'>
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      fill
                      className='object-cover'
                    />
                  </div>
                ) : (
                  <div className='w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center border-4 border-orange-200 shadow-lg'>
                    <User className='w-12 h-12 text-white' />
                  </div>
                )}

                {/* Name and Email */}
                <div className='flex-1 text-center sm:text-left'>
                  <div className='flex items-center justify-center sm:justify-start gap-3 mb-2'>
                    <h1 className='text-3xl sm:text-4xl font-bold text-slate-900'>
                      {displayName}
                    </h1>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className='p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900'
                      title='Edit Profile'
                    >
                      <Edit className='w-5 h-5' />
                    </button>
                  </div>
                  <div className='flex items-center justify-center sm:justify-start gap-2 text-slate-600'>
                    <Mail className='w-4 h-4' />
                    <span className='text-sm sm:text-base'>{email}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Edit Mode
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-2xl font-bold text-slate-900'>Edit Profile</h2>
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    onClick={handleCancel}
                    disabled={isPending}
                    className='px-4 py-2 border bg-slate-100 border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-200 transition-colors'
                  >
                    <X className='w-4 h-4 mr-2' />
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={isPending}
                    className='px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white'
                  >
                    {isPending ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className='w-4 h-4 mr-2' />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Photo Upload */}
              <div className='space-y-2'>
                <Label className='text-slate-700'>Profile Photo</Label>
                <div className='flex items-center gap-4'>
                  <div className='relative'>
                    {avatarUrl ? (
                      <div className='relative w-24 h-24 rounded-full overflow-hidden border-4 border-orange-200 shadow-lg'>
                        <Image
                          src={avatarUrl}
                          alt='Profile'
                          fill
                          className='object-cover'
                        />
                      </div>
                    ) : (
                      <div className='w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center border-4 border-orange-200 shadow-lg'>
                        <User className='w-12 h-12 text-white' />
                      </div>
                    )}
                    {uploadingImage && (
                      <div className='absolute inset-0 bg-black/50 rounded-full flex items-center justify-center'>
                        <Loader2 className='w-5 h-5 text-white animate-spin' />
                      </div>
                    )}
                  </div>
                  <div className='flex-1'>
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='image/*'
                      onChange={handleImageUpload}
                      className='hidden'
                    />
                    <Button
                      type='button'
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className='flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700'
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className='w-4 h-4 animate-spin' />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className='w-4 h-4' />
                          {avatarUrl ? "Change Photo" : "Upload Photo"}
                        </>
                      )}
                    </Button>
                    {uploadError && (
                      <p className='text-xs text-red-500 mt-1'>{uploadError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className='space-y-2'>
                <Label
                  htmlFor='name'
                  className={`${
                    form.formState.errors.name
                      ? "text-red-500"
                      : "text-slate-700"
                  } transition-colors`}
                >
                  {form.formState.errors.name
                    ? form.formState.errors.name.message
                    : "Name"}
                </Label>
                <Input
                  id='name'
                  type='text'
                  {...form.register("name")}
                  placeholder='Your name'
                  className={`w-full px-3 py-2 rounded-lg bg-white text-slate-900 placeholder-slate-400 border transition-colors ${
                    form.formState.errors.name
                      ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                      : "border-slate-200 focus-visible:border-orange-500 focus-visible:ring-orange-500/20"
                  }`}
                />
              </div>

              {/* Email (read-only) */}
              <div className='space-y-2'>
                <Label className='text-slate-700'>Email Address</Label>
                <Input
                  type='email'
                  value={email}
                  disabled
                  className='w-full px-3 py-2 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 cursor-not-allowed'
                />
                <p className='text-xs text-slate-500'>Email cannot be changed</p>
              </div>

              {/* Password Section Toggle */}
              <div className='space-y-2'>
                <button
                  type='button'
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className='flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors'
                >
                  <Lock className='w-4 h-4' />
                  {showPasswordSection
                    ? "Hide Password Change"
                    : "Change Password (Optional)"}
                </button>
              </div>

              {/* Password Fields */}
              {showPasswordSection && (
                <div className='space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200'>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='currentPassword'
                      className={`${
                        form.formState.errors.currentPassword
                          ? "text-red-500"
                          : "text-slate-700"
                      } transition-colors`}
                    >
                      {form.formState.errors.currentPassword
                        ? form.formState.errors.currentPassword.message
                        : "Current Password"}
                    </Label>
                    <Input
                      id='currentPassword'
                      type='password'
                      {...form.register("currentPassword")}
                      placeholder='Enter current password'
                      className={`w-full px-3 py-2 rounded-lg bg-white text-slate-900 placeholder-slate-400 border transition-colors ${
                        form.formState.errors.currentPassword
                          ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                          : "border-slate-200 focus-visible:border-orange-500 focus-visible:ring-orange-500/20"
                      }`}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label
                      htmlFor='newPassword'
                      className={`${
                        form.formState.errors.newPassword
                          ? "text-red-500"
                          : "text-slate-700"
                      } transition-colors`}
                    >
                      {form.formState.errors.newPassword
                        ? form.formState.errors.newPassword.message
                        : "New Password"}
                    </Label>
                    <Input
                      id='newPassword'
                      type='password'
                      {...form.register("newPassword")}
                      placeholder='Enter new password (min 8 characters)'
                      className={`w-full px-3 py-2 rounded-lg bg-white text-slate-900 placeholder-slate-400 border transition-colors ${
                        form.formState.errors.newPassword
                          ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                          : "border-slate-200 focus-visible:border-orange-500 focus-visible:ring-orange-500/20"
                      }`}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label
                      htmlFor='confirmPassword'
                      className={`${
                        form.formState.errors.confirmPassword
                          ? "text-red-500"
                          : "text-slate-700"
                      } transition-colors`}
                    >
                      {form.formState.errors.confirmPassword
                        ? form.formState.errors.confirmPassword.message
                        : "Confirm New Password"}
                    </Label>
                    <Input
                      id='confirmPassword'
                      type='password'
                      {...form.register("confirmPassword")}
                      placeholder='Confirm new password'
                      className={`w-full px-3 py-2 rounded-lg bg-white text-slate-900 placeholder-slate-400 border transition-colors ${
                        form.formState.errors.confirmPassword
                          ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                          : "border-slate-200 focus-visible:border-orange-500 focus-visible:ring-orange-500/20"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* General Error Message */}
              {error && (
                <div className='p-3 bg-red-50 text-red-600 rounded-lg text-sm'>
                  {error}
                </div>
              )}
            </form>
          )}

          {/* Info Cards Section - Only show in view mode */}
          {!isEditMode && (
            <div className='p-6 sm:p-8 mt-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Account Information Card */}
                <div className='bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow'>
                  <h3 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                    <User className='w-5 h-5 text-orange-500' />
                    Account Information
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <p className='text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide'>
                        Email Address
                      </p>
                      <p className='text-sm font-medium text-slate-900 break-all'>
                        {email}
                      </p>
                    </div>
                    {accountCreated && (
                      <div>
                        <p className='text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide'>
                          Member Since
                        </p>
                        <div className='flex items-center gap-2'>
                          <Calendar className='w-4 h-4 text-slate-400' />
                          <p className='text-sm font-medium text-slate-900'>
                            {accountCreated.toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics Card */}
                <div className='bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow'>
                  <h3 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                    <Calendar className='w-5 h-5 text-amber-500' />
                    Your Statistics
                  </h3>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-orange-300 transition-colors'>
                      <span className='text-sm font-medium text-slate-600'>
                        Travel Groups
                      </span>
                      <span className='text-2xl font-bold text-amber-600'>
                        {totalGroups}
                      </span>
                    </div>
                    <div className='flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-orange-300 transition-colors'>
                      <span className='text-sm font-medium text-slate-600'>
                        Total Trips
                      </span>
                      <span className='text-2xl font-bold text-orange-600'>
                        {totalTrips}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info Card - Only show in view mode */}
        {!isEditMode && (
          <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8'>
            <h3 className='text-lg font-semibold text-slate-900 mb-4'>
              About Your Account
            </h3>
            <div className='space-y-3 text-sm text-slate-600'>
              <p>
                You can update your profile information, including your name,
                profile photo, and password, by clicking the edit button above.
              </p>
            </div>
          </div>
        )}
      </div>

      <DashboardBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </main>
  );
};

export default ProfileComponent;
