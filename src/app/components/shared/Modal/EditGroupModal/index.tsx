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
import {
  VIBES,
  getVibeInfo,
  getGroupColorClasses,
} from "@/lib/utils/groupColors";

// Vibes are imported from groupColors

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

  const currentColors = getGroupColorClasses(selectedColorScheme);
  const currentVibe = getVibeInfo(selectedColorScheme);

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
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
      <div className='bg-slate-950 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-white/10'>
        {/* Header with Vibe Background */}
        <div className='flex-shrink-0 p-8 relative overflow-hidden'>
          <div
            className='absolute inset-0 opacity-20'
            style={{ backgroundColor: currentColors.bg.replace("bg-", "") }}
          />
          <div className='absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent' />

          <div className='relative z-10 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div
                className={`w-16 h-16 ${currentColors.bg} rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/20`}
              >
                {selectedEmoji || currentVibe.emoji}
              </div>
              <div>
                <h2 className='text-2xl font-black text-white tracking-tight'>
                  Edit Group
                </h2>
                <div className='flex items-center gap-2 mt-1'>
                  <span
                    className={`w-2 h-2 rounded-full ${currentColors.bg} animate-pulse`}
                  ></span>
                  <span className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>
                    {currentVibe.name} Vibe
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className='p-2 hover:bg-white/5 rounded-xl transition-colors flex-shrink-0 text-slate-400 hover:text-white border border-transparent hover:border-white/5'
              title='Close'
            >
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 space-y-4'
        >
          {/* Group Name */}
          <div className='space-y-3 px-2'>
            <Label className='text-xs font-black uppercase text-slate-500 tracking-widest'>
              Group Name
            </Label>
            <Input
              {...form.register("groupName")}
              placeholder='e.g., Our Adventure 2025'
              className='h-12 bg-slate-900 text-white border-white/5 focus:border-orange-500/50 rounded-xl transition-all'
            />
            {form.formState.errors.groupName && (
              <p className='text-red-400 text-xs font-medium'>
                {form.formState.errors.groupName.message}
              </p>
            )}
          </div>

          {/* Vibe Selection */}
          <div className='space-y-3 px-2'>
            <Label className='text-xs font-black uppercase text-slate-500 tracking-widest'>
              Select Vibe
            </Label>
            <div className='grid grid-cols-2 gap-3 pb-2'>
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
                        key as TEditGroupSchema["colorScheme"],
                      )
                    }
                    className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left ${
                      isSelected
                        ? "bg-slate-900 border-orange-500/50 shadow-lg shadow-orange-500/5"
                        : "bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isSelected ? vibeColors.bg : "bg-slate-800"}`}
                    >
                      {vibe.emoji}
                    </div>
                    <div>
                      <h4
                        className={`font-bold text-[11px] ${isSelected ? "text-white" : "text-slate-400"}`}
                      >
                        {vibe.name}
                      </h4>
                      <p className='text-[8px] text-slate-500 leading-tight line-clamp-1'>
                        {vibe.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <input type='hidden' {...form.register("colorScheme")} />
          </div>

          {/* Custom Emoji Override */}
          <div className='space-y-3 px-2'>
            <Label className='text-xs font-black uppercase text-slate-500 tracking-widest'>
              Custom Icon{" "}
              <span className='text-[10px] lowercase font-normal opacity-50'>
                (optional)
              </span>
            </Label>
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
                className='h-10 bg-slate-900 text-white border-white/5 focus:border-orange-500/50 rounded-lg'
              />
              {selectedEmoji && (
                <button
                  type='button'
                  onClick={() => form.setValue("emoji", null)}
                  className='p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5'
                  title='Clear custom emoji'
                >
                  <X className='w-4 h-4' />
                </button>
              )}
            </div>
          </div>

          {/* General Error Message */}
          {error && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className='flex gap-4 pt-4 px-2'>
            <Button
              type='button'
              onClick={onClose}
              disabled={updateGroup.isPending}
              className='flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/5 rounded-xl font-bold transition-all'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={updateGroup.isPending}
              className='flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-500/10 transition-all active:scale-[0.98]'
            >
              {updateGroup.isPending ? "Syncing..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupModal;
