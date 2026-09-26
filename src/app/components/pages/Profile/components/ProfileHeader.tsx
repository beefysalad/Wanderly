import { Camera, Loader2, Pencil } from "lucide-react";
import type { ChangeEvent, RefObject } from "react";
import { PILL } from "../../../shared/Pills";
import { UserAvatar } from "../../../shared/UserAvatar";

interface ProfileHeaderProps {
  displayName: string;
  email: string;
  about: string;
  avatarUrl: string | null;
  isEditMode: boolean;
  uploadingImage: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onEditClick: () => void;
}

/** Avatar with an amber ring, name, email, bio and the Edit profile pill. */
export function ProfileHeader({
  displayName,
  email,
  about,
  avatarUrl,
  isEditMode,
  uploadingImage,
  fileInputRef,
  onFileChange,
  onEditClick,
}: ProfileHeaderProps) {
  return (
    <div className='flex flex-wrap items-center gap-5'>
      <div className='relative flex-none'>
        <UserAvatar
          name={displayName}
          colorKey={email}
          imageUrl={avatarUrl}
          className='size-[88px] border-2 border-[rgba(251,191,36,.45)] text-[28px]'
        />
        {isEditMode ? (
          <>
            <input type='file' ref={fileInputRef} onChange={onFileChange} className='hidden' accept='image/*' />
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              aria-label='Change photo'
              className='absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-[rgba(2,6,23,.6)] text-[#f8fafc]'
            >
              {uploadingImage ? <Loader2 className='size-5 animate-spin' /> : <Camera className='size-5' />}
            </button>
          </>
        ) : null}
      </div>

      <div className='min-w-0 flex-[1_1_220px]'>
        <h1 className='mb-1 truncate text-[clamp(28px,4.4cqw,40px)] font-extrabold leading-[1.05] tracking-[-.03em]'>
          {displayName}
        </h1>
        <p className='mb-2 truncate text-sm text-[#64748b]'>{email}</p>
        {about ? <p className='whitespace-pre-line text-[15px] text-[#cbd5e1]'>{about}</p> : null}
      </div>

      {isEditMode ? null : (
        <button type='button' onClick={onEditClick} className={PILL.ghost}>
          <Pencil className='size-4' />
          Edit profile
        </button>
      )}
    </div>
  );
}
