"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateGroup } from "@/src/hooks/useGroups";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles, X } from "lucide-react";
import { createGroupSchema, TCreateGroupSchema } from "./createGroupZod";

const COLOR_SCHEMES = [
  {
    value: "orange",
    label: "Orange",
    bg: "bg-orange-500",
    hover: "hover:bg-orange-600",
  },
  {
    value: "blue",
    label: "Blue",
    bg: "bg-blue-500",
    hover: "hover:bg-blue-600",
  },
  {
    value: "green",
    label: "Green",
    bg: "bg-green-500",
    hover: "hover:bg-green-600",
  },
  {
    value: "purple",
    label: "Purple",
    bg: "bg-purple-500",
    hover: "hover:bg-purple-600",
  },
  {
    value: "pink",
    label: "Pink",
    bg: "bg-pink-500",
    hover: "hover:bg-pink-600",
  },
  { value: "red", label: "Red", bg: "bg-red-500", hover: "hover:bg-red-600" },
  {
    value: "amber",
    label: "Amber",
    bg: "bg-amber-500",
    hover: "hover:bg-amber-600",
  },
  {
    value: "emerald",
    label: "Emerald",
    bg: "bg-emerald-500",
    hover: "hover:bg-emerald-600",
  },
  {
    value: "indigo",
    label: "Indigo",
    bg: "bg-indigo-500",
    hover: "hover:bg-indigo-600",
  },
  {
    value: "cyan",
    label: "Cyan",
    bg: "bg-cyan-500",
    hover: "hover:bg-cyan-600",
  },
] as const;

const COMMON_EMOJIS = [
  "✈️",
  "🏖️",
  "🗺️",
  "🎒",
  "🏔️",
  "🌴",
  "🏕️",
  "🚗",
  "🚢",
  "🎡",
  "🎉",
  "🌟",
  "🔥",
  "🎯",
];

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

  const selectedColorScheme = form.watch("colorScheme");
  const selectedEmoji = form.watch("emoji");

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

  return (
    <div className='min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow'></div>
        <div className='absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000'></div>
      </div>

      <div className='w-full max-w-lg z-10'>
        <div className='mb-6'>
          <button
            onClick={() => router.back()}
            className='flex items-center gap-2 text-slate-400 hover:text-white transition-colors group'
          >
            <ArrowLeft className='w-4 h-4 group-hover:-translate-x-1 transition-transform' />
            Back
          </button>
        </div>

        <div className='bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl'>
          {/* Header */}
          <div className='flex items-center gap-4 mb-8'>
            <div>
              <h1 className='text-2xl font-bold text-white'>Create Group</h1>
              <p className='text-slate-400 text-sm'>
                Start a new adventure with friends
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Group Name */}
            <div className='space-y-2'>
              <Label
                htmlFor='groupName'
                className={`${
                  form.formState.errors.groupName
                    ? "text-red-400"
                    : "text-slate-300"
                } transition-colors`}
              >
                {form.formState.errors.groupName
                  ? form.formState.errors.groupName.message
                  : "Group Name"}
              </Label>
              <Input
                id='groupName'
                type='text'
                {...form.register("groupName")}
                placeholder='e.g., Summer Road Trip 2025'
                className={`w-full px-4 py-3 rounded-xl bg-slate-800 text-white placeholder-slate-500 transition-colors border ${
                  form.formState.errors.groupName
                    ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                    : "border-slate-700 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                }`}
              />
            </div>

            {/* Color Scheme */}
            <div className='space-y-3'>
              <Label className='text-slate-300'>Color Theme</Label>
              <div className='grid grid-cols-5 gap-3'>
                {COLOR_SCHEMES.map((color) => (
                  <button
                    key={color.value}
                    type='button'
                    onClick={() => form.setValue("colorScheme", color.value)}
                    className={`w-full aspect-square rounded-xl transition-all duration-200 flex items-center justify-center ${
                      selectedColorScheme === color.value
                        ? `${color.bg} ring-2 ring-offset-2 ring-offset-slate-900 ring-slate-400 scale-110 shadow-lg`
                        : `${color.bg} opacity-50 hover:opacity-100 hover:scale-105`
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
              <input type='hidden' {...form.register("colorScheme")} />
            </div>

            {/* Emoji */}
            <div className='space-y-3'>
              <Label className='text-slate-300'>
                Group Icon <span className='text-slate-500'>(Optional)</span>
              </Label>
              <div className='p-4 bg-slate-800/50 rounded-xl border border-slate-700/50'>
                <div className='flex flex-wrap gap-2 mb-4'>
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type='button'
                      onClick={() => {
                        const newEmoji = selectedEmoji === emoji ? null : emoji;
                        form.setValue("emoji", newEmoji);
                      }}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        selectedEmoji === emoji
                          ? "bg-amber-500/20 border-2 border-amber-500 scale-110"
                          : "bg-slate-800 hover:bg-slate-700 border-2 border-transparent"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className='flex items-center gap-2'>
                  <Input
                    type='text'
                    placeholder='Type a custom emoji...'
                    maxLength={2}
                    value={selectedEmoji || ""}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      form.setValue("emoji", value);
                    }}
                    className='flex-1 bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  />
                  {selectedEmoji && (
                    <button
                      type='button'
                      onClick={() => form.setValue("emoji", null)}
                      className='px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  )}
                </div>
                <input type='hidden' {...form.register("emoji")} />
              </div>
            </div>

            {/* General Error Message */}
            {error && (
              <div className='p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-start gap-2'>
                <div className='mt-0.5 min-w-[16px]'>⚠️</div>
                <p>{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className='flex gap-4 pt-2'>
              <Button
                type='button'
                onClick={() => router.back()}
                disabled={createGroup.isPending}
                className='flex-1 py-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={createGroup.isPending}
                className='flex-1 py-6 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {createGroup.isPending ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Creating...
                  </>
                ) : (
                  <>Create Group</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
