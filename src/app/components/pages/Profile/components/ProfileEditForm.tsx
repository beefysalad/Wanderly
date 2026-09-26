"use client";
import { Loader2, Lock } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { PILL } from "../../../shared/Pills";
import { FIELD_ERROR, FIELD_LABEL, INPUT } from "../../../shared/formStyles";
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
  const { errors } = form.formState;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className='flex flex-col gap-5 rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[clamp(16px,3cqw,26px)]'
    >
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className='text-lg font-bold'>Edit profile</h2>
        <div className='flex gap-[10px]'>
          <button type='button' onClick={onCancel} className={PILL.ghost}>
            Cancel
          </button>
          <button type='submit' disabled={isSubmitting} className={PILL.gradient}>
            {isSubmitting ? <Loader2 className='size-4 animate-spin' /> : null}
            Save changes
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
        <div className='flex flex-col gap-5'>
          <label className='flex flex-col gap-2'>
            <span className={FIELD_LABEL}>Name</span>
            <input {...form.register("name")} className={INPUT} />
            {errors.name ? <span className={FIELD_ERROR}>{errors.name.message}</span> : null}
          </label>
          <label className='flex flex-col gap-2'>
            <span className={FIELD_LABEL}>Bio</span>
            <textarea
              {...form.register("bio")}
              rows={5}
              placeholder='A short intro about your travel style...'
              className={`${INPUT} resize-none`}
            />
          </label>
        </div>

        <div className='flex flex-col gap-5'>
          <label className='flex flex-col gap-2'>
            <span className={FIELD_LABEL}>Travel style</span>
            <input {...form.register("travelStyle")} placeholder='e.g. Foodie, Nature Lover' className={INPUT} />
          </label>

          <div>
            <button
              type='button'
              onClick={onTogglePasswordSection}
              className='flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#94a3b8]'
            >
              <Lock className='size-[14px]' />
              {showPasswordSection ? "Keep current password" : "Change password"}
            </button>

            {showPasswordSection ? (
              <div className='mt-3 flex flex-col gap-3 rounded-2xl border border-white/[.08] bg-[rgba(2,6,23,.5)] p-4'>
                <input
                  type='password'
                  {...form.register("currentPassword")}
                  placeholder='Current password'
                  className={INPUT}
                />
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <input type='password' {...form.register("newPassword")} placeholder='New password' className={INPUT} />
                  <input
                    type='password'
                    {...form.register("confirmPassword")}
                    placeholder='Confirm new'
                    className={INPUT}
                  />
                </div>
                {errors.confirmPassword ? <span className={FIELD_ERROR}>{errors.confirmPassword.message}</span> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}
