"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { TEditProfileSchema } from "../../../shared/Modal/EditProfileModal/editProfileZod";

interface ProfileEditFormProps {
  form: UseFormReturn<TEditProfileSchema>;
  onSubmit: (values: TEditProfileSchema) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  showPasswordSection: boolean;
  onTogglePasswordSection: () => void;
}

export function ProfileEditForm({
  form,
  onSubmit,
  onCancel,
  isSubmitting,
  showPasswordSection,
  onTogglePasswordSection,
}: ProfileEditFormProps) {
  return (
    <div className='bg-slate-900/60 rounded-3xl border border-white/10 p-6 sm:p-10 mb-10'>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10'>
          <h2 className='text-xl font-semibold text-white'>Edit Profile</h2>
          <div className='flex gap-3 w-full sm:w-auto'>
            <Button
              type='button'
              onClick={onCancel}
              variant='outline'
              className='flex-1 sm:flex-none bg-slate-800 border-white/10 text-sm rounded-xl px-5'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 sm:flex-none bg-white text-slate-950 hover:bg-slate-200 text-sm rounded-xl px-5'
            >
              {isSubmitting && <Loader2 className='w-3 h-3 animate-spin mr-2' />}
              Save Identity
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          <div className='space-y-6'>
            <div className='space-y-2'>
              <Label className='text-xs font-medium text-slate-400 ml-1'>Name</Label>
              <Input
                {...form.register("name")}
                className='bg-slate-800 border-white/10 h-12 rounded-xl text-sm'
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-xs font-medium text-slate-400 ml-1'>Bio</Label>
              <textarea
                {...form.register("bio")}
                className='w-full min-h-[150px] bg-slate-800 border border-white/10 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500 placeholder:text-slate-500 transition-all text-sm resize-none'
                placeholder='A short intro about your travel style...'
              />
            </div>
          </div>

          <div className='space-y-6'>
            <div className='space-y-2'>
              <Label className='text-xs font-medium text-slate-400 ml-1'>Travel Style</Label>
              <Input
                {...form.register("travelStyle")}
                placeholder='e.g. Adventure, Relaxed, Budget'
                className='bg-slate-800 border-white/10 h-12 rounded-xl text-sm'
              />
            </div>

            <div className='pt-4'>
              <button
                type='button'
                onClick={onTogglePasswordSection}
                className='flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors'
              >
                <Lock className='w-3 h-3' />
                {showPasswordSection ? "Keep current credentials" : "Update security credentials"}
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
  );
}
