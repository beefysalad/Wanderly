import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { StepHeader } from "./StepHeader";

interface IdentityStepProps {
  displayName: string;
  imageUrl: string;
  bucketList: string;
  setBucketList: (value: string) => void;
  uploadError: string;
  isUploading: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function IdentityStep({
  displayName,
  imageUrl,
  bucketList,
  setBucketList,
  uploadError,
  isUploading,
  handleImageUpload,
  fileInputRef,
}: IdentityStepProps) {
  const initial = (displayName.trim()[0] ?? "?").toUpperCase();

  return (
    <div className='mx-auto flex w-full max-w-[460px] flex-col gap-7'>
      <StepHeader
        eyebrow='Your profile'
        title={
          <>
            Welcome aboard, <span className='text-[#fbbf24]'>{displayName || "traveler"}</span>!
          </>
        }
        subtitle="Let's get you suited up."
      />

      <div className='flex items-center gap-5 rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-5'>
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label='Upload a profile photo'
          className={cn(
            "relative flex size-[88px] flex-none cursor-pointer items-center justify-center rounded-full border-2 border-dashed bg-[#0f172a] p-0",
            imageUrl ? "border-[rgba(251,191,36,.55)]" : "border-[#334155]",
          )}
        >
          {imageUrl ? (
            <Image src={imageUrl} alt='' fill sizes='88px' className='rounded-full object-cover' />
          ) : (
            <span className='text-[26px] font-extrabold text-[#64748b]'>{initial}</span>
          )}
          {isUploading ? (
            <span className='absolute inset-0 flex items-center justify-center rounded-full bg-black/50'>
              <Loader2 className='size-6 animate-spin text-white' />
            </span>
          ) : null}
          <span className='absolute -bottom-[2px] -right-[2px] flex size-[30px] items-center justify-center rounded-full border-[3px] border-[#0b1120] bg-[#fbbf24] text-[#160c02]'>
            <Camera className='size-[14px]' strokeWidth={2.2} />
          </span>
        </button>
        <input
          type='file'
          ref={fileInputRef}
          className='hidden'
          accept='image/*'
          onChange={handleImageUpload}
          disabled={isUploading}
        />
        <div className='flex min-w-0 flex-col gap-1'>
          <span className='text-[15px] font-bold text-[#e2e8f0]'>{imageUrl ? "Looking good." : "Tap to upload a photo"}</span>
          <span className='text-[13px] leading-[1.5] text-[#94a3b8]'>
            So your crew knows who paid for dinner. JPG or PNG, under 5MB.
          </span>
          {uploadError ? <span className='text-[13px] text-[#f87171]'>{uploadError}</span> : null}
        </div>
      </div>

      <label className='flex flex-col gap-[7px]'>
        <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#94a3b8]'>Bucket list top pick</span>
        <input
          type='text'
          value={bucketList}
          onChange={(e) => setBucketList(e.target.value)}
          placeholder='e.g. Kyoto, Japan'
          className='w-full rounded-xl border border-white/[.1] bg-[rgba(15,23,42,.6)] px-[15px] py-[13px] text-[15px] text-[#f8fafc] transition-[border-color,box-shadow] duration-[180ms] placeholder:text-[#475569] focus:border-[rgba(251,191,36,.55)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(251,191,36,.12)]'
        />
      </label>
    </div>
  );
}
