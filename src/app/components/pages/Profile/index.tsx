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
  Users,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import DashboardBottomNav from "../Dashboard/DashboardBottomNav";
import { useForm } from "react-hook-form";
import {
  editProfileSchema,
  TEditProfileSchema,
} from "../../shared/Modal/EditProfileModal/editProfileZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUpdateProfile, useUpdatePassword } from "@/src/hooks/useProfile";
import api from "@/lib/axios";
import { auth } from "@/lib/firebase";
import { signOut, updateProfile } from "firebase/auth";

const ProfileComponent = () => {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const { data: groupsData } = useGroups();
  const groups = groupsData?.groups || [];
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

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const response = await api.post<{ url: string; publicId: string }>(
        "/upload/image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      form.setValue("photo", file);
      setUploadedPhotoURL(response.data.url);
    } catch (error: unknown) {
      console.error("Failed to upload image:", error);
      setUploadError(
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to upload image. Please try again.",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (values: TEditProfileSchema) => {
    try {
      setError(null);
      setUploadError(null);

      const profileUpdates: { name?: string; photoURL?: string } = {};

      if (values.name && values.name !== user?.displayName) {
        profileUpdates.name = values.name;
      }

      if (uploadedPhotoURL) {
        profileUpdates.photoURL = uploadedPhotoURL;
      }

      if (Object.keys(profileUpdates).length > 0) {
        await updateProfileMutation.mutateAsync(profileUpdates);

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

  const totalGroups = groups.length;
  const totalTrips = groups.reduce(
    (acc, group) => acc + (group.trips?.length || 0),
    0,
  );

  if (loading) {
    return (
      <main className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600 font-medium'>Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className='min-h-screen bg-slate-50 flex items-center justify-center px-4'>
        <div className='text-center max-w-md'>
          <div className='w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <User className='w-10 h-10 text-slate-400' />
          </div>
          <p className='text-slate-600 font-medium text-lg'>
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

  const isPending =
    updateProfileMutation.isPending || updatePasswordMutation.isPending;

  return (
    <main className='min-h-screen bg-slate-50 pb-36 md:pb-28'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8'>
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className='mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium'
        >
          <ArrowLeft className='w-4 h-4' />
          Back to Dashboard
        </button>

        {/* Profile Header Card */}
        <div className='bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden'>
          <div className='p-6 sm:p-8'>
            {!isEditMode ? (
              // View Mode
              <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6'>
                {/* Avatar */}
                <div className='relative flex-shrink-0'>
                  {avatarUrl ? (
                    <div className='relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-slate-200'>
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        fill
                        className='object-cover'
                      />
                    </div>
                  ) : (
                    <div className='w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200'>
                      <User className='w-10 h-10 sm:w-12 sm:h-12 text-slate-400' />
                    </div>
                  )}
                </div>

                {/* Name and Email */}
                <div className='flex-1 text-center sm:text-left w-full sm:w-auto'>
                  <div className='flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-3'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-slate-900'>
                      {displayName}
                    </h1>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className='px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors flex items-center gap-2'
                      type='button'
                    >
                      <Edit className='w-4 h-4' />
                      Edit Profile
                    </button>
                  </div>
                  <div className='flex items-center justify-center sm:justify-start gap-2 text-slate-600'>
                    <Mail className='w-4 h-4 flex-shrink-0' />
                    <span className='text-sm break-all'>{email}</span>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200'>
                  <h2 className='text-2xl font-bold text-slate-900'>
                    Edit Profile
                  </h2>
                  <div className='flex gap-2 w-full sm:w-auto'>
                    <Button
                      type='button'
                      onClick={handleCancel}
                      disabled={isPending}
                      variant='outline'
                      className='flex-1 sm:flex-none'
                    >
                      <X className='w-4 h-4 mr-2' />
                      Cancel
                    </Button>
                    <Button
                      type='submit'
                      disabled={isPending}
                      className='flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600'
                    >
                      {isPending ? (
                        <>
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className='w-4 h-4 mr-2' />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Photo Upload */}
                <div className='space-y-3'>
                  <Label className='text-sm font-medium text-slate-700'>
                    Profile Photo
                  </Label>
                  <div className='flex flex-col sm:flex-row items-center sm:items-start gap-4'>
                    <div className='relative flex-shrink-0'>
                      {avatarUrl ? (
                        <div className='relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-slate-200'>
                          <Image
                            src={avatarUrl}
                            alt='Profile'
                            fill
                            className='object-cover'
                          />
                        </div>
                      ) : (
                        <div className='w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200'>
                          <User className='w-10 h-10 sm:w-12 sm:h-12 text-slate-400' />
                        </div>
                      )}
                      {uploadingImage && (
                        <div className='absolute inset-0 bg-black/50 rounded-full flex items-center justify-center'>
                          <Loader2 className='w-5 h-5 text-white animate-spin' />
                        </div>
                      )}
                    </div>
                    <div className='flex-1 w-full sm:w-auto'>
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
                        variant='outline'
                        className='w-full sm:w-auto'
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
                        <p className='text-xs text-red-500 mt-2'>
                          {uploadError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name and Email */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='name'
                      className={`text-sm font-medium ${
                        form.formState.errors.name
                          ? "text-red-500"
                          : "text-slate-700"
                      }`}
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
                      className={
                        form.formState.errors.name
                          ? "border-red-500 focus-visible:border-red-500"
                          : ""
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-slate-700'>
                      Email Address
                    </Label>
                    <Input
                      type='email'
                      value={email}
                      disabled
                      className='bg-slate-50 text-slate-500 cursor-not-allowed'
                    />
                    <p className='text-xs text-slate-500'>
                      Email cannot be changed
                    </p>
                  </div>
                </div>

                {/* Password Section Toggle */}
                <div>
                  <button
                    type='button'
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className='flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors'
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
                        className={`text-sm font-medium ${
                          form.formState.errors.currentPassword
                            ? "text-red-500"
                            : "text-slate-700"
                        }`}
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
                        className={
                          form.formState.errors.currentPassword
                            ? "border-red-500 focus-visible:border-red-500"
                            : ""
                        }
                      />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label
                          htmlFor='newPassword'
                          className={`text-sm font-medium ${
                            form.formState.errors.newPassword
                              ? "text-red-500"
                              : "text-slate-700"
                          }`}
                        >
                          {form.formState.errors.newPassword
                            ? form.formState.errors.newPassword.message
                            : "New Password"}
                        </Label>
                        <Input
                          id='newPassword'
                          type='password'
                          {...form.register("newPassword")}
                          placeholder='Min 8 characters'
                          className={
                            form.formState.errors.newPassword
                              ? "border-red-500 focus-visible:border-red-500"
                              : ""
                          }
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label
                          htmlFor='confirmPassword'
                          className={`text-sm font-medium ${
                            form.formState.errors.confirmPassword
                              ? "text-red-500"
                              : "text-slate-700"
                          }`}
                        >
                          {form.formState.errors.confirmPassword
                            ? form.formState.errors.confirmPassword.message
                            : "Confirm Password"}
                        </Label>
                        <Input
                          id='confirmPassword'
                          type='password'
                          {...form.register("confirmPassword")}
                          placeholder='Confirm new password'
                          className={
                            form.formState.errors.confirmPassword
                              ? "border-red-500 focus-visible:border-red-500"
                              : ""
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className='p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
                    {error}
                  </div>
                )}
              </form>
            )}

            {/* Info Cards Section - Only show in view mode */}
            {!isEditMode && (
              <div className='mt-8 pt-8 border-t border-slate-200'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Account Information Card */}
                  <div className='bg-slate-50 rounded-lg p-5 border border-slate-200'>
                    <div className='flex items-center gap-2 mb-4'>
                      <div className='w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center'>
                        <User className='w-4 h-4 text-orange-600' />
                      </div>
                      <h3 className='text-lg font-semibold text-slate-900'>
                        Account Information
                      </h3>
                    </div>
                    <div className='space-y-4'>
                      <div>
                        <p className='text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide'>
                          Email Address
                        </p>
                        <p className='text-sm font-medium text-slate-900 break-all'>
                          {email}
                        </p>
                      </div>
                      {accountCreated && (
                        <div>
                          <p className='text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide'>
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
                  <div className='bg-slate-50 rounded-lg p-5 border border-slate-200'>
                    <div className='flex items-center gap-2 mb-4'>
                      <div className='w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center'>
                        <MapPin className='w-4 h-4 text-amber-600' />
                      </div>
                      <h3 className='text-lg font-semibold text-slate-900'>
                        Your Statistics
                      </h3>
                    </div>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200'>
                        <div className='flex items-center gap-2'>
                          <Users className='w-4 h-4 text-orange-500' />
                          <span className='text-sm font-medium text-slate-700'>
                            Travel Groups
                          </span>
                        </div>
                        <span className='text-xl font-bold text-orange-600'>
                          {totalGroups}
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200'>
                        <div className='flex items-center gap-2'>
                          <MapPin className='w-4 h-4 text-amber-500' />
                          <span className='text-sm font-medium text-slate-700'>
                            Total Trips
                          </span>
                        </div>
                        <span className='text-xl font-bold text-amber-600'>
                          {totalTrips}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DashboardBottomNav onLogout={handleLogout} />
    </main>
  );
};

export default ProfileComponent;
