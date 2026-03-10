"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { auth } from "@/lib/firebase";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useGroups } from "@/src/hooks/useGroups";
import {
  useCurrentUserDB,
  useUpdatePassword,
  useUpdateProfile,
} from "@/src/hooks/useProfile";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "firebase/auth";
import {
  Calendar,
  Camera,
  Edit,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  User,
  Users
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  editProfileSchema,
  TEditProfileSchema,
} from "../../shared/Modal/EditProfileModal/editProfileZod";
import PremiumPageHeader from "../../shared/PremiumPageHeader";
import DashboardBottomNav from "../Dashboard/DashboardBottomNav";
import LoadingState from "../../shared/LoadingState";

const ProfileComponent = () => {
  const router = useRouter();
  const { user: firebaseUser, loading: firebaseLoading } = useCurrentUser();
  const { data: userDB, isLoading: dbLoading } = useCurrentUserDB();
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
      setPhotoPreview(userDB?.imageUrl || firebaseUser?.photoURL || null);
      setUploadedPhotoURL(null);
      setShowPasswordSection(false);
    }
  }, [userDB, firebaseUser, form, isEditMode]);

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
      formData.append("folder", "users/avatars");

      const response = await api.post<{ url: string; publicId: string }>(
        "/upload/image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setUploadedPhotoURL(response.data.url);
    } catch (error: unknown) {
      console.error("Failed to upload image:", error);
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
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

      if (
        values.name &&
        values.name !== (userDB?.name || firebaseUser?.displayName)
      ) {
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
    form.reset();
    setPhotoPreview(userDB?.imageUrl || firebaseUser?.photoURL || null);
  };

  const totalGroups = groups.length;
  const totalTrips = groups.reduce((acc, g) => acc + (g.trips?.length || 0), 0);
  const totalActivities = groups.reduce(
    (acc, g) =>
      acc +
      (g.trips?.reduce((tAcc, t) => tAcc + (t.activities?.length || 0), 0) ||
        0),
    0,
  );
  const uniqueLocations = Array.from(
    new Set(
      groups.flatMap(
        (g) => g.trips?.map((t) => t.location).filter(Boolean) || [],
      ),
    ),
  ).length;

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
    userDB?.name ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split("@")[0] ||
    "Traveler";
  const avatarUrl =
    photoPreview || userDB?.imageUrl || firebaseUser?.photoURL || null;
  const email = firebaseUser?.email || "";
  const memberSince = userDB?.createdAt
    ? new Date(userDB.createdAt)
    : new Date();

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
        <div className='bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 mb-8'>
          <div className='flex flex-col md:flex-row items-center md:items-start gap-6'>
            <div className='relative group'>
              <div className='relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-white/15 bg-slate-900 overflow-hidden'>
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    fill
                    className='object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-slate-600'>
                    <User className='w-12 h-12' />
                  </div>
                )}
              </div>

              <input
                type='file'
                ref={fileInputRef}
                onChange={handleImageUpload}
                className='hidden'
                accept='image/*'
              />
              <button
                onClick={() => {
                  if (isEditMode && !uploadingImage) {
                    fileInputRef.current?.click();
                  } else if (!isEditMode) {
                    setIsEditMode(true);
                  }
                }}
                disabled={uploadingImage}
                className={`absolute -bottom-1 -right-1 w-9 h-9 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-full flex items-center justify-center border border-white/15 transition-all ${
                  isEditMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                } ${uploadingImage ? "cursor-not-allowed opacity-100" : ""}`}
                type='button'
                title={isEditMode ? "Change Photo" : "Edit Profile"}
              >
                {uploadingImage ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <Camera className='w-4 h-4' />
                )}
              </button>
            </div>

            <div className='flex-1 text-center md:text-left space-y-3'>
              <div>
                <h1 className='text-3xl sm:text-4xl font-semibold text-white mb-2'>
                  {displayName}
                </h1>
                <div className='flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 text-sm'>
                  <div className='flex items-center gap-2'>
                    <Mail className='w-4 h-4' />
                    <span>{email}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Calendar className='w-4 h-4' />
                    <span>Member since {memberSince.getFullYear()}</span>
                  </div>
                </div>
              </div>

              {userDB?.travelStyle && (
                <div className='inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-white/10 rounded-full text-xs font-medium text-slate-300'>
                  <MapPin className='w-3 h-3' />
                  {userDB.travelStyle}
                </div>
              )}

              <p className='text-slate-300 leading-relaxed max-w-xl mx-auto md:mx-0 text-sm'>
                {userDB?.bio || "No bio yet. Tell us where you're headed next."}
              </p>
            </div>
          </div>
        </div>

        {!isEditMode && (
          <div className='flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8'>
            <button
              onClick={() => setIsEditMode(true)}
              className='px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-200 font-medium text-sm rounded-xl transition-all flex items-center gap-2'
            >
              <Edit className='w-4 h-4' />
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              className='px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl border border-white/10 transition-all flex items-center gap-2'
            >
              <LogOut className='w-4 h-4' />
              Sign Out
            </button>
          </div>
        )}

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

        {/* Conditional Content: Edit Form vs Dashboard Stats */}
        {isEditMode ? (
          <div className='bg-slate-900/60 rounded-3xl border border-white/10 p-6 sm:p-10 mb-10'>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-8'
            >
              <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10'>
                <h2 className='text-xl font-semibold text-white'>
                  Edit Profile
                </h2>
                <div className='flex gap-3 w-full sm:w-auto'>
                  <Button
                    type='button'
                    onClick={handleCancel}
                    variant='outline'
                    className='flex-1 sm:flex-none bg-slate-800 border-white/10 text-sm rounded-xl px-5'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={updateProfileMutation.isPending}
                    className='flex-1 sm:flex-none bg-white text-slate-950 hover:bg-slate-200 text-sm rounded-xl px-5'
                  >
                    {updateProfileMutation.isPending && (
                      <Loader2 className='w-3 h-3 animate-spin mr-2' />
                    )}
                    Save Identity
                  </Button>
                </div>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                <div className='space-y-6'>
                  <div className='space-y-2'>
                    <Label className='text-xs font-medium text-slate-400 ml-1'>
                      Name
                    </Label>
                    <Input
                      {...form.register("name")}
                      className='bg-slate-800 border-white/10 h-12 rounded-xl text-sm'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-xs font-medium text-slate-400 ml-1'>
                      Bio
                    </Label>
                    <textarea
                      {...form.register("bio")}
                      className='w-full min-h-[150px] bg-slate-800 border border-white/10 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500 placeholder:text-slate-500 transition-all text-sm resize-none'
                      placeholder='A short intro about your travel style...'
                    />
                  </div>
                </div>

                <div className='space-y-6'>
                  <div className='space-y-2'>
                    <Label className='text-xs font-medium text-slate-400 ml-1'>
                      Travel Style
                    </Label>
                    <Input
                      {...form.register("travelStyle")}
                      placeholder='e.g. Adventure, Relaxed, Budget'
                      className='bg-slate-800 border-white/10 h-12 rounded-xl text-sm'
                    />
                  </div>

                  <div className='pt-4'>
                    <button
                      type='button'
                      onClick={() =>
                        setShowPasswordSection(!showPasswordSection)
                      }
                      className='flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors'
                    >
                      <Lock className='w-3 h-3' />
                      {showPasswordSection
                        ? "Keep current credentials"
                        : "Update security credentials"}
                    </button>

                    {showPasswordSection && (
                      <div className='mt-4 grid grid-cols-1 gap-4 p-4 bg-slate-950 rounded-xl border border-white/10'>
                        <Input
                          type='password'
                          {...form.register("currentPassword")}
                          className='bg-slate-800 border-white/10 h-11 rounded-xl'
                          placeholder='Current Password'
                        />
                        <div className='grid grid-cols-2 gap-4'>
                          <Input
                            type='password'
                            {...form.register("newPassword")}
                            className='bg-slate-800 border-white/10 h-11 rounded-xl'
                            placeholder='New Password'
                          />
                          <Input
                            type='password'
                            {...form.register("confirmPassword")}
                            className='bg-slate-800 border-white/10 h-11 rounded-xl'
                            placeholder='Confirm New'
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className='space-y-10'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              {[
                {
                  label: "Groups",
                  value: totalGroups,
                  icon: Users,
                },
                {
                  label: "Destinations",
                  value: uniqueLocations,
                  icon: Globe,
                },
                {
                  label: "Activities",
                  value: totalActivities,
                  icon: Calendar,
                },
                {
                  label: "Trips",
                  value: totalTrips,
                  icon: MapPin,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className='bg-slate-900/60 border border-white/10 rounded-2xl p-4'
                >
                  <div className='flex items-center justify-between mb-3'>
                    <p className='text-xs text-slate-400'>{stat.label}</p>
                    <stat.icon className='w-4 h-4 text-slate-500' />
                  </div>
                  <p className='text-2xl sm:text-3xl font-semibold text-white'>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {groups.length > 0 && (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-base font-semibold text-white'>
                    Recent Journeys
                  </h3>
                  <button
                    onClick={() => router.push("/groups")}
                    className='text-sm text-slate-400 hover:text-white transition-colors'
                  >
                    View All
                  </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  {groups.slice(0, 4).map((group) => (
                    <div
                      key={group.id}
                      onClick={() => router.push(`/group/${group.id}`)}
                      className='p-4 bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 rounded-2xl transition-colors cursor-pointer'
                    >
                      <div className='flex items-center gap-4'>
                        <div className='w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl'>
                          {group.emoji || "✈️"}
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-semibold text-white text-sm mb-1'>
                            {group.name}
                          </h4>
                          <div className='flex items-center gap-3'>
                            <p className='text-xs text-slate-400'>
                              {group.trips?.length || 0} trips
                            </p>
                            <div className='w-1 h-1 rounded-full bg-slate-600' />
                            <p className='text-xs text-slate-400'>
                              {group.memberEmails?.length || 0} members
                            </p>
                          </div>
                        </div>
                        <span className='text-xs text-slate-500'>Open</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <DashboardBottomNav />
    </main>
  );
};

export default ProfileComponent;
