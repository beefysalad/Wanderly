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
  LogOut,
  Globe,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import DashboardBottomNav from "../Dashboard/DashboardBottomNav";
import DashboardLayoutHeader from "../../shared/DashboardLayoutHeader";
import { useForm } from "react-hook-form";
import {
  editProfileSchema,
  TEditProfileSchema,
} from "../../shared/Modal/EditProfileModal/editProfileZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useUpdateProfile,
  useUpdatePassword,
  useCurrentUserDB,
} from "@/src/hooks/useProfile";
import api from "@/lib/axios";
import { auth } from "@/lib/firebase";
import { signOut, updateProfile } from "firebase/auth";

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
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>
        <div className='text-center'>
          <div className='relative w-20 h-20 mx-auto mb-6'>
            <div className='absolute inset-0 border-4 border-slate-800 rounded-full'></div>
            <div className='absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin'></div>
          </div>
          <p className='text-slate-400 font-bold tracking-tight'>
            Loading amazing profile...
          </p>
        </div>
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
    <main className='min-h-screen bg-slate-950 pb-36 md:pb-28 text-slate-200'>
      {/* Visual Header / Banner */}
      <div className='relative h-48 sm:h-64 bg-slate-900 overflow-hidden'>
        <div className='absolute inset-0 bg-slate-800/20' />
        <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent' />
      </div>

      <div className='max-w-4xl mx-auto px-4 sm:px-6 -mt-24 relative z-10'>
        {/* Header Navigation */}
        <div className='mb-6 flex items-center justify-between'>
          <button
            onClick={() => router.push("/dashboard")}
            className='p-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white hover:bg-slate-800 transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          {!isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className='px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2'
            >
              <Edit className='w-4 h-4' />
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div className='bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden mb-8'>
          <div className='p-6 sm:p-10'>
            {!isEditMode ? (
              <div className='flex flex-col md:flex-row items-center md:items-start gap-8'>
                {/* Avatar */}
                <div className='relative flex-shrink-0'>
                  <div className='relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-4 border-slate-900 shadow-2xl ring-1 ring-white/10'>
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        fill
                        className='object-cover'
                      />
                    ) : (
                      <div className='w-full h-full bg-slate-800 flex items-center justify-center'>
                        <User className='w-16 h-16 text-slate-600' />
                      </div>
                    )}
                  </div>
                  <div className='absolute -bottom-2 -right-2 w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center border-4 border-slate-900 shadow-lg'>
                    <MapPin className='w-5 h-5 text-white' />
                  </div>
                </div>

                {/* Info */}
                <div className='flex-1 text-center md:text-left'>
                  <div className='mb-4'>
                    <h1 className='text-3xl sm:text-4xl font-black text-white tracking-tight mb-1'>
                      {displayName}
                    </h1>
                    <div className='flex items-center justify-center md:justify-start gap-4 text-slate-400'>
                      <div className='flex items-center gap-1.5 text-sm'>
                        <Mail className='w-4 h-4' />
                        <span>{email}</span>
                      </div>
                      <div className='hidden sm:flex items-center gap-1.5 text-sm'>
                        <Calendar className='w-4 h-4' />
                        <span>Joined {memberSince.getFullYear()}</span>
                      </div>
                    </div>
                  </div>

                  {userDB?.travelStyle && (
                    <div className='inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-bold uppercase tracking-wider mb-4'>
                      <MapPin className='w-3 h-3' />
                      {userDB.travelStyle}
                    </div>
                  )}

                  <p className='text-slate-300 leading-relaxed max-w-xl mx-auto md:mx-0'>
                    {userDB?.bio ||
                      "No bio yet. Tell us where you're headed next!"}
                  </p>
                </div>
              </div>
            ) : (
              // EDIT MODE
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-8'
              >
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5'>
                  <h2 className='text-2xl font-black text-white uppercase tracking-tighter'>
                    Edit Profile
                  </h2>
                  <div className='flex gap-3 w-full sm:w-auto'>
                    <Button
                      type='button'
                      onClick={handleCancel}
                      variant='outline'
                      className='flex-1 sm:flex-none border-white/10 bg-slate-800 hover:bg-slate-700 text-white'
                    >
                      Cancel
                    </Button>
                    <Button
                      type='submit'
                      disabled={updateProfileMutation.isPending}
                      className='flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 font-bold'
                    >
                      {updateProfileMutation.isPending ? (
                        <Loader2 className='w-4 h-4 animate-spin mr-2' />
                      ) : (
                        <Save className='w-4 h-4 mr-2' />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-10'>
                  {/* Photo Column */}
                  <div className='space-y-4 text-center sm:text-left'>
                    <Label className='text-xs font-black uppercase text-slate-500 tracking-widest'>
                      Profile Image
                    </Label>
                    <div className='relative group'>
                      <div className='relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-2 border-white/10 mx-auto sm:mx-0'>
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt='Profile'
                            fill
                            className='object-cover'
                          />
                        ) : (
                          <div className='w-full h-full bg-slate-800 flex items-center justify-center'>
                            <User className='w-12 h-12 text-slate-600' />
                          </div>
                        )}
                        {uploadingImage && (
                          <div className='absolute inset-0 bg-slate-900/80 flex items-center justify-center backdrop-blur-sm'>
                            <Loader2 className='w-6 h-6 text-orange-500 animate-spin' />
                          </div>
                        )}
                      </div>
                      <button
                        type='button'
                        onClick={() => fileInputRef.current?.click()}
                        className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl'
                      >
                        <Camera className='w-8 h-8 text-white' />
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='image/*'
                      onChange={handleImageUpload}
                      className='hidden'
                    />
                    <p className='text-xs text-slate-500'>
                      Click image to change. Max 5MB.
                    </p>
                  </div>

                  {/* Fields Column */}
                  <div className='lg:col-span-2 space-y-6'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                      <div className='space-y-2'>
                        <Label className='text-xs font-black uppercase text-slate-500 tracking-widest'>
                          Display Name
                        </Label>
                        <Input
                          {...form.register("name")}
                          className='bg-slate-800/50 border-white/10 h-12'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-xs font-black uppercase text-slate-500 tracking-widest'>
                          Travel Style
                        </Label>
                        <Input
                          {...form.register("travelStyle")}
                          placeholder='e.g. Backpacker, Luxury, Hybrid'
                          className='bg-slate-800/50 border-white/10 h-12'
                        />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label className='text-xs font-black uppercase text-slate-500 tracking-widest'>
                        About Me / Bio
                      </Label>
                      <textarea
                        {...form.register("bio")}
                        className='w-full min-h-[120px] bg-slate-800/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-slate-600'
                        placeholder='Tell the world about your travel philosophy...'
                      />
                    </div>

                    <button
                      type='button'
                      onClick={() =>
                        setShowPasswordSection(!showPasswordSection)
                      }
                      className='flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors'
                    >
                      <Lock className='w-4 h-4' />
                      {showPasswordSection
                        ? "Cancel security update"
                        : "Update Password"}
                    </button>

                    {showPasswordSection && (
                      <div className='space-y-4 p-6 bg-slate-950/50 rounded-xl border border-white/5'>
                        <div className='space-y-2'>
                          <Label className='text-xs font-black uppercase text-slate-500 tracking-widest'>
                            Current Password
                          </Label>
                          <Input
                            type='password'
                            {...form.register("currentPassword")}
                            className='bg-slate-800/50 border-white/10'
                          />
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                          <div className='space-y-2'>
                            <Label className='text-xs font-black uppercase text-slate-500 tracking-widest'>
                              New Password
                            </Label>
                            <Input
                              type='password'
                              {...form.register("newPassword")}
                              className='bg-slate-800/50 border-white/10'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-xs font-black uppercase text-slate-500 tracking-widest'>
                              Confirm New
                            </Label>
                            <Input
                              type='password'
                              {...form.register("confirmPassword")}
                              className='bg-slate-800/50 border-white/10'
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {!isEditMode && (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
            {[
              {
                label: "Travel Groups",
                value: totalGroups,
                icon: Users,
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                label: "Total Trips",
                value: totalTrips,
                icon: MapPin,
                color: "text-orange-400",
                bg: "bg-orange-500/10",
              },
              {
                label: "Check-ins Done",
                value: totalActivities,
                icon: Calendar,
                color: "text-purple-400",
                bg: "bg-purple-500/10",
              },
              {
                label: "Destinations",
                value: uniqueLocations,
                icon: Globe,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className='bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 group hover:border-orange-500/30 transition-all'
              >
                <div
                  className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className='text-2xl font-black text-white mb-1'>
                  {stat.value}
                </div>
                <div className='text-[10px] font-black uppercase tracking-widest text-slate-500'>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Journey Preview */}
        {!isEditMode && groups.length > 0 && (
          <div className='space-y-4'>
            <h3 className='text-xl font-black text-white uppercase tracking-tighter'>
              Recent Explorations
            </h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {groups.slice(0, 4).map((group, i) => (
                <div
                  key={group.id}
                  onClick={() => router.push(`/group/${group.id}`)}
                  className='p-5 bg-slate-900/40 border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-slate-800/50 hover:border-white/20 transition-all cursor-pointer group'
                >
                  <div className='w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform'>
                    {group.emoji || "✈️"}
                  </div>
                  <div>
                    <h4 className='font-bold text-white group-hover:text-orange-400 transition-colors uppercase text-sm tracking-tight'>
                      {group.name}
                    </h4>
                    <p className='text-xs text-slate-500'>
                      {group.trips?.length || 0} trips planned
                    </p>
                  </div>
                  <ArrowLeft className='w-4 h-4 text-slate-600 ml-auto rotate-180' />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout Button */}
        {!isEditMode && (
          <div className='mt-12 text-center'>
            <button
              onClick={handleLogout}
              className='px-6 py-2 text-sm text-red-500/60 hover:text-red-400 font-medium transition-colors flex items-center gap-2 mx-auto'
            >
              <LogOut className='w-4 h-4' />
              Sign Out from Wanderly
            </button>
          </div>
        )}
      </div>

      <DashboardBottomNav />
    </main>
  );
};

export default ProfileComponent;
