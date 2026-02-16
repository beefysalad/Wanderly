"use client";

import api from "@/lib/axios";
import { User } from "@/src/shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Baby,
  Backpack,
  Building2,
  Calendar,
  Camera,
  Check,
  CreditCard,
  Gem,
  Heart,
  Loader2,
  Mountain,
  Palmtree,
  Plane,
  PlaneIcon,
  User as UserIcon,
  Users,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import PremiumBackground from "../../../shared/PremiumBackground";

interface OnboardingWizardProps {
  user: User;
  onComplete: () => void;
}

type Step = "WELCOME" | "IDENTITY" | "DNA" | "CREW" | "TUTORIAL" | "ACTION";

const VIBES = [
  {
    id: "Backpacker",
    icon: Backpack,
    label: "Backpacker",
    desc: "Budget & Hostels",
  },
  { id: "Luxury", icon: Gem, label: "Luxury", desc: "Comfort & Hotels" },
  {
    id: "City",
    icon: Building2,
    label: "City Breaker",
    desc: "Culture & Nightlife",
  },
  {
    id: "Nature",
    icon: Palmtree,
    label: "Nature Lover",
    desc: "Beach & Hiking",
  },
  { id: "Foodie", icon: Utensils, label: "Foodie", desc: "Local Eats" },
  {
    id: "Adventure",
    icon: Mountain,
    label: "Adventurer",
    desc: "Thrills & Action",
  },
];

const CREWS = [
  {
    id: "Solo",
    icon: UserIcon,
    label: "Solo Traveler",
    desc: "Just me and the world",
  },
  { id: "Couple", icon: Heart, label: "Couple", desc: "Romantic getaways" },
  { id: "Friends", icon: Users, label: "Friends Group", desc: "Squad on tour" },
  { id: "Family", icon: Baby, label: "Family", desc: "Making memories" },
];

const OnboardingWizard = ({ user, onComplete }: OnboardingWizardProps) => {
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
    if (file.size > 5 * 1024 * 1024) {
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
      // Construct bio addition
      let bioUpdate = user.bio || "";

      // Add Bucket List if present (First Step)
      // Format: "Dreaming of [Place] 🌍"
      if (bucketList && !bioUpdate.includes("Dreaming of")) {
        bioUpdate = bioUpdate ? `${bioUpdate}\n` : "";
        bioUpdate += `Dreaming of ${bucketList} 🌍`;
      }

      // Add Crew if present (Later Step)
      // Format: "Travels as a Couple 💑", "Solo Traveler 🎒", etc.
      if (selectedCrew) {
        let crewText = "";
        if (selectedCrew === "Solo") crewText = "Solo Traveler 🎒";
        else if (selectedCrew === "Couple") crewText = "Travels as a Couple 💑";
        else if (selectedCrew === "Friends")
          crewText = "Travels with Friends 👯‍♂️";
        else if (selectedCrew === "Family") crewText = "Travels with Family 👨‍👩‍👧‍👦";

        if (crewText && !bioUpdate.includes(crewText)) {
          bioUpdate = bioUpdate ? `${bioUpdate}\n` : "";
          bioUpdate += crewText;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: any = {};
      if (displayName) updates.name = displayName;
      if (imageUrl) updates.imageUrl = imageUrl;
      if (selectedVibes.length > 0)
        updates.travelStyle = selectedVibes.join(", ");

      // Only update bio if we modified it
      if (bioUpdate !== (user.bio || "")) {
        updates.bio = bioUpdate;
      }

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

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white font-sans overflow-hidden'>
      {/* Dynamic Background */}
      <PremiumBackground />

      {/* Content Container */}
      <div className='w-full max-w-5xl px-4 relative z-10'>
        <AnimatePresence mode='wait'>
          {/* STEP 1: WELCOME */}
          {step === "WELCOME" && (
            <motion.div
              key='welcome'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              className='text-center max-w-2xl mx-auto'
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className='w-24 h-24 bg-slate-800 rounded-3xl rotate-3 flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/10'
              >
                <Plane className='w-12 h-12 text-amber-500' />
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className='text-5xl md:text-7xl font-black tracking-tighter mb-6 text-white'
              >
                Welcome to <br /> Wanderly
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className='text-xl text-slate-400 mb-12 font-medium max-w-lg mx-auto leading-relaxed'
              >
                Let&apos;s personalize your journey. We&apos;ll help you plan,
                split costs, and travel better.
              </motion.p>

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setStep("IDENTITY")}
                className='group relative px-10 py-5 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-black text-lg tracking-wide hover:scale-105 active:scale-95 transition-all'
              >
                Begin Journey
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2: IDENTITY */}
          {step === "IDENTITY" && (
            <motion.div
              key='identity'
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className='max-w-md mx-auto bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl'
            >
              <h2 className='text-3xl font-bold mb-2 text-center'>
                Welcome aboard, <br />{" "}
                <span className='text-amber-500'>{displayName}</span>!
              </h2>
              <p className='text-slate-400 text-center mb-8'>
                Let&apos;s get you suited up.
              </p>

              <div className='flex flex-col items-center mb-8'>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className='relative w-32 h-32 rounded-full cursor-pointer group'
                >
                  <div className='relative w-full h-full rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center hover:border-amber-500 transition-colors'>
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt='Profile'
                        fill
                        className='object-cover'
                      />
                    ) : (
                      <Users className='w-10 h-10 text-slate-500' />
                    )}
                    {isUploading && (
                      <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
                        <Loader2 className='w-8 h-8 animate-spin text-white' />
                      </div>
                    )}
                  </div>
                  <div className='absolute bottom-0 right-0 bg-amber-600 text-white p-2 rounded-full shadow-lg border-2 border-slate-900'>
                    <Camera className='w-4 h-4' />
                  </div>
                </div>
                <input
                  type='file'
                  ref={fileInputRef}
                  className='hidden'
                  accept='image/*'
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                {uploadError && (
                  <p className='text-red-400 text-xs mt-2'>{uploadError}</p>
                )}
                <p className='text-xs text-slate-500 mt-3 font-medium uppercase tracking-widest text-center'>
                  Tap to Upload Photo
                </p>
              </div>

              <div className='space-y-6'>
                <div>
                  <label className='block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-2'>
                    Bucket List Top Pick 🌍
                  </label>
                  <input
                    type='text'
                    value={bucketList}
                    onChange={(e) => setBucketList(e.target.value)}
                    className='w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:bg-slate-700 focus:border-amber-500 transition-all placeholder:text-slate-600 text-white'
                    placeholder='e.g. Kyoto, Japan'
                  />
                </div>

                <button
                  onClick={() => handleUpdateProfile("DNA")}
                  disabled={isUploading || isSubmitting}
                  className='w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
                >
                  {isSubmitting ? (
                    <Loader2 className='w-6 h-6 animate-spin mx-auto' />
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: TRAVELER DNA */}
          {step === "DNA" && (
            <motion.div
              key='dna'
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className='max-w-4xl mx-auto'
            >
              <div className='text-center mb-10'>
                <h2 className='text-4xl font-black mb-3'>
                  What&apos;s your vibe?
                </h2>
                <p className='text-slate-400 text-lg'>
                  Select all that apply to your travel style
                </p>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mb-12'>
                {VIBES.map((vibe) => {
                  const isSelected = selectedVibes.includes(vibe.id);
                  const Icon = vibe.icon;
                  return (
                    <motion.button
                      key={vibe.id}
                      onClick={() => toggleVibe(vibe.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-6 rounded-3xl border text-left transition-all ${
                        isSelected
                          ? "bg-amber-600 text-white border-amber-500"
                          : "bg-slate-900/40 border-white/5 hover:bg-slate-800 hover:border-white/10"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-white/5 text-slate-400"
                        }`}
                      >
                        <Icon className='w-6 h-6' />
                      </div>
                      <h3
                        className={`text-lg font-bold mb-1 ${isSelected ? "text-white" : "text-slate-300"}`}
                      >
                        {vibe.label}
                      </h3>
                      <p
                        className={`text-xs font-medium uppercase tracking-wider ${isSelected ? "text-white/80" : "text-slate-500"}`}
                      >
                        {vibe.desc}
                      </p>

                      {isSelected && (
                        <div className='absolute top-4 right-4 bg-white/20 rounded-full p-1'>
                          <Check className='w-3 h-3 text-white' />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className='flex justify-center'>
                <button
                  onClick={() => handleUpdateProfile("CREW")}
                  disabled={selectedVibes.length === 0}
                  className='px-12 py-4 bg-white text-slate-950 rounded-full font-black text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 hover:bg-slate-200'
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: THE CREW */}
          {step === "CREW" && (
            <motion.div
              key='crew'
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className='max-w-4xl mx-auto'
            >
              <div className='text-center mb-6 md:mb-10'>
                <h2 className='text-3xl md:text-4xl font-black mb-2 md:mb-3'>
                  Who&apos;s your crew?
                </h2>
                <p className='text-slate-400 text-base md:text-lg px-4'>
                  Who do you usually explore the world with?
                </p>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12'>
                {CREWS.map((item) => {
                  const isSelected = selectedCrew === item.id;
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => setSelectedCrew(item.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-4 md:p-6 rounded-2xl md:rounded-[32px] border text-center transition-all flex flex-col items-center justify-center aspect-square ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-xl"
                          : "bg-slate-900/40 border-white/5 hover:bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon
                        className={`w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 ${isSelected ? "text-white" : "text-slate-500"}`}
                      />
                      <h3 className={`text-base md:text-lg font-bold mb-1`}>
                        {item.label}
                      </h3>
                      <p
                        className={`text-[10px] md:text-xs leading-tight ${isSelected ? "text-white/80" : "text-slate-500"}`}
                      >
                        {item.desc}
                      </p>
                    </motion.button>
                  );
                })}
              </div>

              <div className='flex justify-center'>
                <button
                  onClick={() => handleUpdateProfile("TUTORIAL")}
                  disabled={!selectedCrew}
                  className='px-12 py-4 bg-white text-slate-950 rounded-full font-black text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 hover:bg-slate-200'
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: TUTORIAL */}
          {step === "TUTORIAL" && (
            <motion.div
              key='tutorial'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              className='max-w-5xl mx-auto px-4'
            >
              <div className='text-center mb-8 md:mb-12'>
                <h2 className='text-2xl md:text-3xl font-bold mb-2'>
                  Here&apos;s what you can do
                </h2>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12'>
                {[
                  {
                    title: "Squad Goals",
                    desc: "Create groups and invite your friends instantly.",
                    icon: Users,
                    color: "text-blue-400",
                    bg: "bg-blue-500/10 border-blue-500/20",
                  },
                  {
                    title: "Perfect Plan",
                    desc: "Build detailed itineraries with ease.",
                    icon: Calendar,
                    color: "text-purple-400",
                    bg: "bg-purple-500/10 border-purple-500/20",
                  },
                  {
                    title: "Split Costs",
                    desc: "Track expenses and settle up without the math.",
                    icon: CreditCard,
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10 border-emerald-500/20",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className='bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-3xl'
                  >
                    <div
                      className={`w-12 h-12 md:w-16 md:h-16 ${item.bg} rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg border`}
                    >
                      <item.icon
                        className={`w-6 h-6 md:w-8 md:h-8 ${item.color}`}
                      />
                    </div>
                    <h3 className='text-lg md:text-xl font-bold text-white mb-2'>
                      {item.title}
                    </h3>
                    <p className='text-sm md:text-base text-slate-400 leading-relaxed'>
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className='flex justify-center'>
                <button
                  onClick={() => setStep("ACTION")}
                  className='px-8 md:px-12 py-3 md:py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-black text-base md:text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-900/20'
                >
                  I&apos;m Ready
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: ACTION */}
          {step === "ACTION" && (
            <motion.div
              key='action'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='w-full h-[80vh] flex flex-col md:flex-row gap-4 md:gap-8 max-w-6xl mx-auto items-center justify-center'
            >
              <motion.button
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                whileHover={{ scale: 1.02, flex: 1.2 }}
                onClick={() => handleCompleteOnboarding("CREATE_GROUP")}
                className='group flex-1 w-full h-full min-h-[300px] bg-amber-900/10 border border-amber-500/20 hover:bg-amber-900/20 hover:border-amber-500/40 rounded-[40px] flex flex-col items-center justify-center p-8 transition-all duration-500 backdrop-blur-md'
              >
                <div className='w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-8 border border-amber-500/20 group-hover:scale-110 transition-transform duration-500'>
                  <PlaneIcon className='w-10 h-10 text-amber-500' />
                </div>
                <h2 className='text-4xl font-black text-white mb-4 text-center uppercase tracking-tight'>
                  Plan a Trip
                </h2>
                <p className='text-slate-400 text-center max-w-xs text-lg font-medium group-hover:text-amber-200 transition-colors'>
                  Create a new group and start your adventure from scratch.
                </p>
              </motion.button>

              <div className='text-slate-500 font-bold text-xl uppercase tracking-widest'>
                OR
              </div>

              <motion.button
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                whileHover={{ scale: 1.02, flex: 1.2 }}
                onClick={() => handleCompleteOnboarding("JOIN_GROUP")}
                className='group flex-1 w-full h-full min-h-[300px] bg-indigo-900/10 border border-indigo-500/20 hover:bg-indigo-900/20 hover:border-indigo-500/40 rounded-[40px] flex flex-col items-center justify-center p-8 transition-all duration-500 backdrop-blur-md'
              >
                <div className='w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500'>
                  <Users className='w-10 h-10 text-indigo-500' />
                </div>
                <h2 className='text-4xl font-black text-white mb-4 text-center uppercase tracking-tight'>
                  Join a Crew
                </h2>
                <p className='text-slate-400 text-center max-w-xs text-lg font-medium group-hover:text-indigo-200 transition-colors'>
                  Have a code? Enter it to join an existing trip instantly.
                </p>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Indicator (Bottom) */}
      <div className='fixed bottom-8 left-0 right-0 flex justify-center gap-2 z-20'>
        {["WELCOME", "IDENTITY", "DNA", "CREW", "TUTORIAL", "ACTION"].map(
          (s, i) => {
            const currentIndex = [
              "WELCOME",
              "IDENTITY",
              "DNA",
              "CREW",
              "TUTORIAL",
              "ACTION",
            ].indexOf(step);
            return (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i <= currentIndex ? "w-8 bg-amber-500" : "w-2 bg-slate-700"
                }`}
              />
            );
          },
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
