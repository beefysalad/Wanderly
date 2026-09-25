import { Calendar, Camera, Edit, Loader2, LogOut, Mail, MapPin, User } from "lucide-react";
import Image from "next/image";
import type { RefObject } from "react";

interface ProfileHeaderProps {
  displayName: string;
  email: string;
  memberSince: Date;
  avatarUrl: string | null;
  travelStyle?: string;
  bio?: string;
  isEditMode: boolean;
  uploadingImage: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarButtonClick: () => void;
  onEditClick: () => void;
  onLogout: () => void;
}

export function ProfileHeader({
  displayName,
  email,
  memberSince,
  avatarUrl,
  travelStyle,
  bio,
  isEditMode,
  uploadingImage,
  fileInputRef,
  onFileChange,
  onAvatarButtonClick,
  onEditClick,
  onLogout,
}: ProfileHeaderProps) {
  return (
    <>
      <div className='bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 mb-8'>
        <div className='flex flex-col md:flex-row items-center md:items-start gap-6'>
          <div className='relative group'>
            <div className='relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-white/15 bg-slate-900 overflow-hidden'>
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} fill className='object-cover' />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-slate-600'>
                  <User className='w-12 h-12' />
                </div>
              )}
            </div>

            <input
              type='file'
              ref={fileInputRef}
              onChange={onFileChange}
              className='hidden'
              accept='image/*'
            />
            <button
              onClick={onAvatarButtonClick}
              disabled={uploadingImage}
              className={`absolute -bottom-1 -right-1 w-9 h-9 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-full flex items-center justify-center border border-white/15 transition-all ${
                isEditMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              } ${uploadingImage ? "cursor-not-allowed opacity-100" : ""}`}
              type='button'
              title={isEditMode ? "Change Photo" : "Edit Profile"}
            >
              {uploadingImage ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Camera className='w-4 h-4' />
              )}
            </button>
          </div>

          <div className='flex-1 text-center md:text-left space-y-3'>
            <div>
              <h1 className='text-3xl sm:text-4xl font-semibold text-white mb-2'>
                {displayName}
              </h1>
              <div className='flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 text-sm'>
                <div className='flex items-center gap-2'>
                  <Mail className='w-4 h-4' />
                  <span>{email}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  <span>Member since {memberSince.getFullYear()}</span>
                </div>
              </div>
            </div>

            {travelStyle && (
              <div className='inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-white/10 rounded-full text-xs font-medium text-slate-300'>
                <MapPin className='w-3 h-3' />
                {travelStyle}
              </div>
            )}

            <p className='text-slate-300 leading-relaxed max-w-xl mx-auto md:mx-0 text-sm'>
              {bio || "No bio yet. Tell us where you're headed next."}
            </p>
          </div>
        </div>
      </div>

      {!isEditMode && (
        <div className='flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8'>
          <button
            onClick={onEditClick}
            className='px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-200 font-medium text-sm rounded-xl transition-all flex items-center gap-2'
          >
            <Edit className='w-4 h-4' />
            Edit Profile
          </button>
          <button
            onClick={onLogout}
            className='px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl border border-white/10 transition-all flex items-center gap-2'
          >
            <LogOut className='w-4 h-4' />
            Sign Out
          </button>
        </div>
      )}
    </>
  );
}
