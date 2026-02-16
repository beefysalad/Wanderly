"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/src/shared/types";
import { ArrowRight, Check, CreditCard, Users, Plane, Sparkles, Camera, Upload, MapPin, Calendar, Plus } from "lucide-react";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OnboardingWizardProps {
  user: User;
  onComplete: () => void;
}

type Step = "WELCOME" | "PROFILE" | "TUTORIAL" | "ACTION";

const OnboardingWizard = ({ user, onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState<Step>("WELCOME");
  const [tutorialStep, setTutorialStep] = useState(0);
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [imageUrl, setImageUrl] = useState(user.imageUrl || user.avatar || "");
  const [referralSource, setReferralSource] = useState(user.referralSource || "");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleUpdateProfile = async () => {
    try {
      setIsSubmitting(true);
      await api.patch("/user/profile", {
        name,
        bio,
        imageUrl,
        referralSource,
      });
      // Invalidate user query to reflect changes
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setStep("TUTORIAL");
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // reset error
    setUploadError("");

    // 5MB Validation
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

  const handleCompleteOnboarding = async (
    nextAction?: "CREATE_GROUP" | "JOIN_GROUP"
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
      setIsSubmitting(false); // Only reset if error, otherwise we are navigating/unmounting
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <AnimatePresence mode="wait">
          {step === "WELCOME" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                <Plane className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Welcome to Wanderly!
              </h1>
              <p className="text-lg text-slate-400 mb-8 max-w-md mx-auto">
                Your ultimate companion for group travel. Plan trips, split expenses,
                and create memories together.
              </p>
              <button
                onClick={() => setStep("PROFILE")}
                className="group relative inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-100 transition-all hover:scale-105"
              >
                Let&apos;s Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === "PROFILE" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12"
            >
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Tell us about yourself
                </h2>
                <p className="text-slate-400 mb-8">
                  This is how your friends will see you in the group.
                </p>

                <div className="flex flex-col items-center mb-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 bg-slate-800">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <Users className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </label>
                    <div className="absolute bottom-0 right-0 bg-amber-500 rounded-full p-1.5 border-2 border-slate-900">
                        <Upload className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Tap to upload photo</p>
                  {uploadError && (
                    <p className="text-xs text-red-400 mt-1 font-medium bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                      {uploadError}
                    </p>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isUploading || isSubmitting}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g. Alex Explorer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Bio (Optional)
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      disabled={isUploading || isSubmitting}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g. I love hiking and street food!"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      How did you hear about us?
                    </label>
                    <div className="relative">
                      <Select
                        value={referralSource}
                        onValueChange={setReferralSource}
                        disabled={isUploading || isSubmitting}
                      >
                        <SelectTrigger className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-6 text-white focus:ring-2 focus:ring-amber-500 focus:ring-offset-0 focus:border-transparent h-auto">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white z-[60]">
                           <SelectItem value="creator" className="text-white focus:bg-slate-800 focus:text-white cursor-pointer">Patrick</SelectItem>
                           <SelectItem value="friend" className="text-white focus:bg-slate-800 focus:text-white cursor-pointer">Friend / Family (Invited)</SelectItem>
                           <SelectItem value="social" className="text-white focus:bg-slate-800 focus:text-white cursor-pointer">Social Media (TikTok, IG, etc.)</SelectItem>
                           <SelectItem value="search" className="text-white focus:bg-slate-800 focus:text-white cursor-pointer">Search Engine</SelectItem>
                           <SelectItem value="other" className="text-white focus:bg-slate-800 focus:text-white cursor-pointer">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={!name.trim() || isSubmitting || isUploading}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-full font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "TUTORIAL" && (
            <motion.div
              key="tutorial"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 text-center"
            >
              <AnimatePresence mode="wait">
                {tutorialStep === 0 && (
                  <motion.div
                    key="groups"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Users className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                      1. Create a Group
                    </h2>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                      First, create a <strong>Group</strong> for your squad. This is your hub where you can plan multiple trips together.
                    </p>
                  </motion.div>
                )}
                {tutorialStep === 1 && (
                  <motion.div
                    key="trips"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                     <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                      2. Plan Trips & Activities
                    </h2>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                      Inside your group, create a <strong>Trip</strong>. Then, build your itinerary by adding <strong>Activities</strong> for each day.
                    </p>
                  </motion.div>
                )}
                {tutorialStep === 2 && (
                  <motion.div
                    key="expenses"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                     <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                      3. Split Expenses
                    </h2>
                     <div className="bg-slate-800/50 rounded-2xl p-4 mb-8 text-left border border-white/5 mx-auto max-w-xs scale-90">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"><Plus className="w-5 h-5 text-white" /></div>
                             <div className="text-xs text-slate-400">Add expense to activity</div>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full w-full"></div>
                     </div>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                      Finally, add <strong>Expenses</strong> directly to any Activity (or the Trip itself). We&apos;ll handle the splitting math for you.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-center justify-center gap-2 mb-8">
                 {[0, 1, 2].map((i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === tutorialStep ? 'bg-amber-500' : 'bg-slate-700'}`} />
                 ))}
              </div>

              <div className="flex justify-center">
                  <button
                    onClick={() => {
                        if (tutorialStep < 2) {
                            setTutorialStep(prev => prev + 1);
                        } else {
                            setStep("ACTION");
                        }
                    }}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-100 transition-all hover:scale-105"
                  >
                    {tutorialStep < 2 ? "Next" : "Got it"}
                    {tutorialStep < 2 ? <ArrowRight className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                  </button>
              </div>
            </motion.div>
          )}

          {step === "ACTION" && (
            <motion.div
              key="action"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                Start Your Journey
              </h2>
              <p className="text-slate-400 mb-8">
                How would you like to begin?
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button
                  onClick={() => handleCompleteOnboarding("CREATE_GROUP")}
                  disabled={isSubmitting}
                  className="group flex flex-col items-center justify-center p-8 bg-slate-800/50 hover:bg-amber-600/10 border border-white/10 hover:border-amber-500/50 rounded-2xl transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-amber-500/20 text-amber-500 group-hover:bg-amber-500 group-hover:text-white rounded-full flex items-center justify-center mb-4 transition-colors">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Create New Trip Group</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300">
                    Plan a new adventure and invite your friends
                  </p>
                </button>

                <button
                  onClick={() => handleCompleteOnboarding("JOIN_GROUP")}
                  disabled={isSubmitting}
                  className="group flex flex-col items-center justify-center p-8 bg-slate-800/50 hover:bg-indigo-600/10 border border-white/10 hover:border-indigo-500/50 rounded-2xl transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-indigo-500/20 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white rounded-full flex items-center justify-center mb-4 transition-colors">
                    <Users className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Join Existing Group</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300">
                    Have a code? Join a trip already being planned
                  </p>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingWizard;
