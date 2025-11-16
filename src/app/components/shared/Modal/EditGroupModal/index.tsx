import { X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { editGroupSchema, TEditGroupSchema } from "./editGroupZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUpdateGroup } from "@/src/hooks/useGroups";
import { Group } from "@/src/shared/types";

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

interface IEditGroupModalProps {
  group: Group;
  onClose: () => void;
}

const EditGroupModal = ({ group, onClose }: IEditGroupModalProps) => {
  const [error, setError] = useState<string | null>(null);
  const updateGroup = useUpdateGroup();

  const form = useForm<TEditGroupSchema>({
    resolver: zodResolver(editGroupSchema),
    defaultValues: {
      groupName: group.name,
      colorScheme: (group.colorScheme ||
        "orange") as TEditGroupSchema["colorScheme"],
      emoji: group.emoji || null,
    },
  });

  // Update form when group changes
  useEffect(() => {
    form.reset({
      groupName: group.name,
      colorScheme: (group.colorScheme ||
        "orange") as TEditGroupSchema["colorScheme"],
      emoji: group.emoji || null,
    });
  }, [group, form]);

  const selectedColorScheme = form.watch("colorScheme");
  const selectedEmoji = form.watch("emoji");

  const onSubmit = async (values: TEditGroupSchema) => {
    try {
      setError(null);
      await updateGroup.mutateAsync({
        groupId: group.id,
        name: values.groupName,
        colorScheme: values.colorScheme || "orange",
        emoji: values.emoji || null,
      });
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update group";
      setError(message);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full max-h-[75vh] flex flex-col overflow-hidden'>
        {/* Header */}
        <div className='flex-shrink-0 p-6 border-b border-slate-200 flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
              Edit Group
            </h2>
            <p className='text-sm text-slate-600 mt-1'>
              Update group name, color, and emoji
            </p>
          </div>

          <button
            onClick={onClose}
            className='p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0 relative z-10'
            title='Close'
          >
            <X className='w-5 h-5 text-slate-500' />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 space-y-4'
        >
          {/* Group Name */}
          <div className='space-y-2'>
            <Label
              htmlFor='groupName'
              className={`${
                form.formState.errors.groupName
                  ? "text-red-500"
                  : "text-slate-700 dark:text-slate-300"
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
              placeholder='e.g., Our Adventure 2025'
              className={`w-full px-3 py-2 rounded-lg bg-white text-slate-900 placeholder-slate-400 border transition-colors ${
                form.formState.errors.groupName
                  ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                  : "border-slate-200 focus-visible:border-orange-500 focus-visible:ring-orange-500/20"
              }`}
            />
          </div>

          {/* Color Scheme */}
          <div className='space-y-2'>
            <Label className='text-slate-700 dark:text-slate-300'>
              Color Scheme
            </Label>
            <div className='grid grid-cols-5 gap-2'>
              {COLOR_SCHEMES.map((color) => (
                <button
                  key={color.value}
                  type='button'
                  onClick={() => form.setValue("colorScheme", color.value)}
                  className={`w-full h-10 rounded-lg transition-all ${
                    selectedColorScheme === color.value
                      ? `${color.bg} ring-2 ring-offset-2 ring-slate-300 scale-105`
                      : `${color.bg} ${color.hover} opacity-60 hover:opacity-100`
                  }`}
                  title={color.label}
                />
              ))}
            </div>
            <input type='hidden' {...form.register("colorScheme")} />
          </div>

          {/* Emoji */}
          <div className='space-y-2'>
            <Label className='text-slate-700 dark:text-slate-300'>
              Emoji (Optional)
            </Label>
            <div className='flex flex-wrap gap-2 mb-2'>
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
                      ? "bg-orange-100 border-2 border-orange-500 scale-110"
                      : "bg-slate-100 hover:bg-slate-200 border-2 border-transparent"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className='flex items-center gap-2'>
              <Input
                type='text'
                placeholder='Or type custom emoji'
                maxLength={2}
                value={selectedEmoji || ""}
                onChange={(e) => {
                  const value = e.target.value || null;
                  form.setValue("emoji", value);
                }}
                className='flex-1'
              />
              {selectedEmoji && (
                <button
                  type='button'
                  onClick={() => form.setValue("emoji", null)}
                  className='px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors'
                >
                  Clear
                </button>
              )}
            </div>
            <input type='hidden' {...form.register("emoji")} />
          </div>

          {/* General Error Message */}
          {error && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className='flex gap-3 pt-4'>
            <Button
              type='button'
              onClick={onClose}
              disabled={updateGroup.isPending}
              className='flex-1 px-4 py-2 border bg-slate-150 border-slate-300 rounded-lg text-slate-700  font-medium hover:bg-slate-200  transition-colors'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={updateGroup.isPending}
              className='flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {updateGroup.isPending ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupModal;
