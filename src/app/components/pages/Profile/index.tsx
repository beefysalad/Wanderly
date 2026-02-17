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
  ArrowLeft,
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
import PremiumBackground from "../../shared/PremiumBackground";
import PremiumPageHeader from "../../shared/PremiumPageHeader";
import DashboardBottomNav from "../Dashboard/DashboardBottomNav";

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
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden'>
        <PremiumBackground />
        <div className='text-center relative z-10'>
          <div className='relative w-20 h-20 mx-auto mb-6'>
            <div className='absolute inset-0 border-4 border-slate-800 rounded-full'></div>
            <div className='absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin'></div>
          </div>
          <p className='text-slate-400 font-bold tracking-tight'>
            Loading profile...
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
    <main className='min-h-screen bg-slate-950 pb-24 text-slate-200 relative overflow-x-hidden selection:bg-purple-500/30 font-sans'>
      <PremiumBackground />

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

      {/* Top Identity Section (Unified & Premium) */}
      <div className='max-w-3xl mx-auto px-6 pt-8 sm:pt-12 pb-8 relative z-10'>
        <div className='flex flex-col md:flex-row items-center md:items-end gap-8 mb-12'>
          {/* Avatar with Glow and Gradient Ring */}
          <div className='relative group'>
            <div className='absolute -inset-1 bg-gradient-to-tr from-purple-500 via-blue-500 to-emerald-500 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity' />
            <div className='relative w-32 h-32 sm:w-40 sm:h-40 rounded-full p-[3px] bg-gradient-to-tr from-purple-500/20 via-blue-500/20 to-emerald-500/20 backdrop-blur-3xl border border-white/10'>
              <div className='w-full h-full rounded-full overflow-hidden bg-slate-950/80 backdrop-blur-xl'>
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    fill
                    className='object-cover opacity-90 group-hover:opacity-100 transition-opacity'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-slate-700'>
                    <User className='w-16 h-16' />
                  </div>
                )}
              </div>
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
              className={`absolute bottom-1 right-1 w-10 h-10 bg-slate-900/80 backdrop-blur-xl hover:bg-white/10 text-slate-400 hover:text-white rounded-full flex items-center justify-center border border-white/10 shadow-2xl transition-all active:scale-90 ${
                isEditMode
                  ? "opacity-100 animate-pulse"
                  : "opacity-0 group-hover:opacity-100"
              } ${uploadingImage ? "cursor-not-allowed opacity-100" : ""}`}
              type='button'
              title={isEditMode ? "Change Photo" : "Edit Profile"}
            >
              {uploadingImage ? (
                <Loader2 className='w-5 h-5 animate-spin text-purple-500' />
              ) : (
                <Camera className='w-5 h-5' />
              )}
            </button>
          </div>

          {/* Identity Info */}
          <div className='flex-1 text-center md:text-left space-y-3 pb-2'>
            <div>
              <h1 className='text-3xl sm:text-5xl font-black text-white tracking-widest uppercase mb-1 drop-shadow-sm'>
                {displayName}
              </h1>
              <div className='flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]'>
                <div className='flex items-center gap-1.5'>
                  <Mail className='w-3 h-3 text-purple-400' />
                  <span>{email}</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <Calendar className='w-3 h-3 text-emerald-400' />
                  <span>Explorer since {memberSince.getFullYear()}</span>
                </div>
              </div>
            </div>

            {userDB?.travelStyle && (
              <div className='inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400'>
                <MapPin className='w-3 h-3 text-orange-400' />
                {userDB.travelStyle}
              </div>
            )}

            <p className='text-slate-400 leading-relaxed max-w-xl mx-auto md:mx-0 text-xs font-medium'>
              {userDB?.bio || "No bio yet. Tell us where you're headed next!"}
            </p>
          </div>
        </div>

        {/* Action Buttons (Integrated) */}
        {!isEditMode && (
          <div className='flex flex-wrap items-center justify-center md:justify-start gap-3 mb-12'>
            <button
              onClick={() => setIsEditMode(true)}
              className='px-6 py-2.5 bg-white text-slate-950 hover:bg-slate-200 font-black text-[10px] uppercase tracking-widest rounded-full transition-all flex items-center gap-2 shadow-lg shadow-white/5'
            >
              <Edit className='w-4 h-4' />
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              className='px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-full border border-white/10 transition-all flex items-center gap-2'
            >
              <LogOut className='w-4 h-4' />
              Sign Out
            </button>
          </div>
        )}

        {/* Conditional Content: Edit Form vs Dashboard Stats */}
        {isEditMode ? (
          <div className='bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-12 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-8 sm:space-y-12'
            >
              <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5'>
                <h2 className='text-xl font-black text-white uppercase tracking-[0.2em]'>
                  Edit Profile
                </h2>
                <div className='flex gap-3 w-full sm:w-auto'>
                  <Button
                    type='button'
                    onClick={handleCancel}
                    variant='outline'
                    className='flex-1 sm:flex-none bg-slate-800 border-white/10 text-xs font-black uppercase tracking-widest rounded-full px-6'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={updateProfileMutation.isPending}
                    className='flex-1 sm:flex-none bg-white text-slate-950 hover:bg-slate-200 text-xs font-black uppercase tracking-widest rounded-full px-6 shadow-xl shadow-white/5'
                  >
                    {updateProfileMutation.isPending && (
                      <Loader2 className='w-3 h-3 animate-spin mr-2' />
                    )}
                    Save Identity
                  </Button>
                </div>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
                <div className='space-y-8'>
                  <div className='space-y-2'>
                    <Label className='text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1'>
                      Explorer Name
                    </Label>
                    <Input
                      {...form.register("name")}
                      className='bg-white/5 border-white/5 h-14 rounded-2xl focus:ring-purple-500/50 text-base font-medium transition-all'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1'>
                      Travel Philosophy (Bio)
                    </Label>
                    <textarea
                      {...form.register("bio")}
                      className='w-full min-h-[160px] bg-white/5 border border-white/5 rounded-2xl p-5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-700 transition-all text-sm font-medium resize-none'
                      placeholder='Describe your journey...'
                    />
                  </div>
                </div>

                <div className='space-y-8'>
                  <div className='space-y-2'>
                    <Label className='text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1'>
                      Travel Style
                    </Label>
                    <Input
                      {...form.register("travelStyle")}
                      placeholder='e.g. Minimalist Explorer'
                      className='bg-white/5 border-white/5 h-14 rounded-2xl focus:ring-emerald-500/50 text-base font-medium transition-all'
                    />
                  </div>

                  <div className='pt-4'>
                    <button
                      type='button'
                      onClick={() =>
                        setShowPasswordSection(!showPasswordSection)
                      }
                      className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors'
                    >
                      <Lock className='w-3 h-3' />
                      {showPasswordSection
                        ? "Keep current credentials"
                        : "Update security credentials"}
                    </button>

                    {showPasswordSection && (
                      <div className='mt-6 grid grid-cols-1 gap-4 p-6 bg-black/40 rounded-2xl border border-white/5 animate-in fade-in zoom-in-95 duration-300'>
                        <Input
                          type='password'
                          {...form.register("currentPassword")}
                          className='bg-white/5 border-white/5 h-12 rounded-xl'
                          placeholder='Current Password'
                        />
                        <div className='grid grid-cols-2 gap-4'>
                          <Input
                            type='password'
                            {...form.register("newPassword")}
                            className='bg-white/5 border-white/5 h-12 rounded-xl'
                            placeholder='New Password'
                          />
                          <Input
                            type='password'
                            {...form.register("confirmPassword")}
                            className='bg-white/5 border-white/5 h-12 rounded-xl'
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
          <div className='space-y-24 animate-in fade-in duration-700'>
            {/* Stats Grid (Minimal & Elegant) */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12'>
              {[
                {
                  label: "Voyages",
                  value: totalGroups,
                  icon: Users,
                  color: "from-blue-400 to-cyan-400",
                },
                {
                  label: "Destinations",
                  value: uniqueLocations,
                  icon: Globe,
                  color: "from-emerald-400 to-teal-400",
                },
                {
                  label: "Milestones",
                  value: totalActivities,
                  icon: Calendar,
                  color: "from-purple-400 to-pink-400",
                },
                {
                  label: "Total Trips",
                  value: totalTrips,
                  icon: MapPin,
                  color: "from-orange-400 to-amber-400",
                },
              ].map((stat) => (
                <div key={stat.label} className='group relative'>
                  <div className='absolute -inset-2 bg-white/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity' />
                  <div className='relative'>
                    <div className='flex items-baseline gap-2'>
                      <span
                        className={`text-4xl sm:text-6xl font-black bg-gradient-to-br ${stat.color} bg-clip-text text-transparent tracking-tighter leading-none`}
                      >
                        {stat.value}
                      </span>
                    </div>
                    <div className='mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-300 transition-colors'>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Journey Explorations */}
            {groups.length > 0 && (
              <div className='space-y-8 pt-4'>
                <div className='flex items-center justify-between border-b border-white/5 pb-4'>
                  <h3 className='text-xs font-black text-white uppercase tracking-[0.3em]'>
                    Recent Journeys
                  </h3>
                  <button
                    onClick={() => router.push("/groups")}
                    className='text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors'
                  >
                    View All
                  </button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                  {groups.slice(0, 4).map((group) => (
                    <div
                      key={group.id}
                      onClick={() => router.push(`/group/${group.id}`)}
                      className='group relative p-6 bg-slate-900/20 hover:bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-3xl transition-all cursor-pointer overflow-hidden'
                    >
                      <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-12 -mt-12 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity' />
                      <div className='relative flex items-center gap-5'>
                        <div className='w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner'>
                          {group.emoji || "✈️"}
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-black text-white group-hover:text-orange-400 transition-colors uppercase text-sm tracking-widest mb-1'>
                            {group.name}
                          </h4>
                          <div className='flex items-center gap-3'>
                            <p className='text-[10px] font-bold text-slate-500 uppercase tracking-wider'>
                              {group.trips?.length || 0} Missions
                            </p>
                            <div className='w-1 h-1 rounded-full bg-slate-800' />
                            <p className='text-[10px] font-bold text-slate-500 uppercase tracking-wider'>
                              {group.memberEmails?.length || 0} Explorers
                            </p>
                          </div>
                        </div>
                        <div className='w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0'>
                          <ArrowLeft className='w-4 h-4 text-white rotate-180' />
                        </div>
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
