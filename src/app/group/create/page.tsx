"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateGroup } from "@/src/hooks/useGroups";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Loader2,
  Compass,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { createGroupSchema, TCreateGroupSchema } from "./createGroupZod";
import {
  VIBES,
  getVibeInfo,
  getGroupColorClasses,
} from "@/lib/utils/groupColors";

// Vibes are imported from groupColors

export default function CreateGroupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const createGroup = useCreateGroup();

  const form = useForm<TCreateGroupSchema>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      groupName: "",
      colorScheme: "orange",
      emoji: null,
    },
  });

  const groupName = form.watch("groupName");
  const selectedColorScheme = form.watch("colorScheme");
  const selectedEmoji = form.watch("emoji");

  // Sync emoji with vibe default when vibe changes, UNLESS the user has set a custom emoji
  useEffect(() => {
    const vibe = getVibeInfo(selectedColorScheme);
    if (
      !selectedEmoji ||
      Object.values(VIBES).some((v) => v.emoji === selectedEmoji)
    ) {
      form.setValue("emoji", vibe.emoji);
    }
  }, [selectedColorScheme, form, selectedEmoji]);

  const onSubmit = async (values: TCreateGroupSchema) => {
    try {
      setError(null);
      const result = await createGroup.mutateAsync({
        name: values.groupName,
        colorScheme: values.colorScheme || "orange",
        emoji: values.emoji || null,
      });
      // Navigate to the new group
      if (result.group) {
        router.push(`/group/${result.group.id}`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create group";
      setError(message);
    }
  };

  const currentColors = getGroupColorClasses(selectedColorScheme);

  return (
    <div className='min-h-screen bg-slate-950 flex flex-col items-center p-4 sm:p-8 pt-12 relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div
          className='absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl opacity-20'
          style={{ backgroundColor: currentColors.bg.replace("bg-", "") }}
        />
        <div className='absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-3xl opacity-10' />
      </div>

      <div className='w-full max-w-5xl z-10'>
        <div className='mb-8'>
          <button
            onClick={() => router.back()}
            className='flex items-center gap-2 text-slate-500 hover:text-white transition-colors group'
          >
            <ArrowLeft className='w-4 h-4 group-hover:-translate-x-1 transition-transform' />
            Cancel
          </button>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-5 gap-8'>
          {/* Left Column: Form */}
          <div className='lg:col-span-3 space-y-8'>
            <div>
              <h1 className='text-4xl font-black text-white mb-2 tracking-tight'>
                Start Your <span className='text-orange-500'>Adventure</span>
              </h1>
              <p className='text-slate-400 text-lg'>
                Create a space for your group to plan and share memories.
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-10'>
              {/* Group Name */}
              <div className='space-y-4'>
                <Label className='text-xs font-black uppercase text-slate-500 tracking-widest'>
                  What should we call this group?
                </Label>
                <div className='relative'>
                  <Input
                    {...form.register("groupName")}
                    placeholder='e.g., Paraluman'
                    className='h-16 px-6 text-xl bg-slate-900 text-white border-white/5 focus:border-orange-500/50 rounded-2xl transition-all'
                  />
                  {form.formState.errors.groupName && (
                    <p className='text-red-400 text-sm mt-2 font-medium'>
                      {form.formState.errors.groupName.message}
                    </p>
                  )}
                  {error && (
                    <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm mt-2'>
                      {error}
                    </div>
                  )}
                </div>
              </div>

              {/* Vibe Selection */}
              <div className='space-y-4'>
                <Label className='text-xs font-black uppercase text-slate-500 tracking-widest'>
                  Choose the Vibe
                </Label>
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                  {Object.entries(VIBES).map(([key, vibe]) => {
                    const vibeColors = getGroupColorClasses(key);
                    const isSelected = selectedColorScheme === key;

                    return (
                      <button
                        key={key}
                        type='button'
                        onClick={() =>
                          form.setValue(
                            "colorScheme",
                            key as TCreateGroupSchema["colorScheme"],
                          )
                        }
                        className={`group relative flex flex-col items-start p-4 rounded-2xl border transition-all duration-300 ${
                          isSelected
                            ? "bg-slate-900 border-orange-500/50 shadow-xl shadow-orange-500/10"
                            : "bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-xl ${isSelected ? vibeColors.bg : "bg-slate-800"}`}
                        >
                          {vibe.emoji}
                        </div>
                        <h4
                          className={`font-bold text-sm ${isSelected ? "text-white" : "text-slate-400"}`}
                        >
                          {vibe.name}
                        </h4>
                        <p className='text-[10px] text-slate-500 leading-tight mt-1'>
                          {vibe.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className='flex gap-4'>
                <Button
                  type='submit'
                  disabled={createGroup.isPending}
                  className='flex-1 py-8 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg h-16 rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50'
                >
                  {createGroup.isPending ? (
                    <Loader2 className='w-6 h-6 animate-spin' />
                  ) : (
                    "Create Group"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Preview */}
          <div className='lg:col-span-2 relative'>
            <div className='sticky top-8'>
              <div className='mb-6'>
                <Label className='text-xs font-black uppercase text-slate-500 tracking-widest'>
                  Live Preview
                </Label>
              </div>

              <div className='p-8 rounded-3xl bg-slate-900/50 border border-white/5 backdrop-blur-xl'>
                <p className='text-slate-500 text-xs mb-6 text-center italic'>
                  This is how your group will look on the dashboard
                </p>

                {/* Preview Group Card */}
                <div className='max-w-[240px] mx-auto'>
                  <div className='group relative flex flex-col items-start p-4 h-full bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl'>
                    <div
                      className={`absolute inset-0 opacity-10 bg-gradient-to-tr ${currentColors.bg.replace("bg-", "from-")} to-transparent rounded-2xl`}
                    />

                    <div className='flex items-start justify-between w-full mb-4'>
                      <div
                        className={`w-12 h-12 ${currentColors.bg} rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/10`}
                      >
                        {selectedEmoji || <Compass className='w-6 h-6' />}
                      </div>
                      <div className='flex items-center justify-center w-8 h-8 rounded-full bg-white/5'>
                        <ChevronRight className='w-4 h-4 text-slate-400' />
                      </div>
                    </div>

                    <div className='w-full'>
                      <h3 className='text-base font-bold text-white mb-2 truncate'>
                        {groupName || "New Adventure"}
                      </h3>

                      <div className='flex flex-wrap gap-2'>
                        <div className='flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded-md'>
                          <UsersIcon className='w-3 h-3' />
                          <span>1 Member</span>
                        </div>
                        <div className='flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded-md'>
                          <CalendarIcon className='w-3 h-3' />
                          <span>0 Trips</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='mt-10 space-y-4'>
                  <div className='flex items-center gap-3 text-slate-400 text-sm'>
                    <div className='w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center'>
                      <ShieldCheck className='w-3 h-3 text-orange-500' />
                    </div>
                    <span>You&apos;ll be the group creator</span>
                  </div>
                  <div className='flex items-center gap-3 text-slate-400 text-sm'>
                    <div className='w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center'>
                      <Compass className='w-3 h-3 text-orange-500' />
                    </div>
                    <span>Instant invite code generation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
