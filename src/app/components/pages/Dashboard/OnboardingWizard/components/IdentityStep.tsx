import { Camera, Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { Step } from "../onboardingOptions";

interface IIdentityStepProps {
  displayName: string;
  imageUrl: string;
  bucketList: string;
  setBucketList: (value: string) => void;
  uploadError: string;
  isUploading: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpdateProfile: (nextStep: Step) => void;
  isSubmitting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const IdentityStep = ({ displayName, imageUrl, bucketList, setBucketList, uploadError, isUploading, handleImageUpload, handleUpdateProfile, isSubmitting, fileInputRef }: IIdentityStepProps) => {
  return (
    <motion.div
      key='identity'
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className='max-w-md mx-auto bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl'
    >
      <h2 className='text-3xl font-bold mb-2 text-center'>
        Welcome aboard, <br />{" "}
        <span className='text-amber-500'>{displayName}</span>!
      </h2>
      <p className='text-slate-400 text-center mb-8'>
        Let&apos;s get you suited up.
      </p>

      <div className='flex flex-col items-center mb-8'>
        <div
          onClick={() => fileInputRef.current?.click()}
          className='relative w-32 h-32 rounded-full cursor-pointer group'
        >
          <div className='relative w-full h-full rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center hover:border-amber-500 transition-colors'>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt='Profile'
                fill
                className='object-cover'
              />
            ) : (
              <Users className='w-10 h-10 text-slate-500' />
            )}
            {isUploading && (
              <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
                <Loader2 className='w-8 h-8 animate-spin text-white' />
              </div>
            )}
          </div>
          <div className='absolute bottom-0 right-0 bg-amber-600 text-white p-2 rounded-full shadow-lg border-2 border-slate-900'>
            <Camera className='w-4 h-4' />
          </div>
        </div>
        <input
          type='file'
          ref={fileInputRef}
          className='hidden'
          accept='image/*'
          onChange={handleImageUpload}
          disabled={isUploading}
        />
        {uploadError && (
          <p className='text-red-400 text-xs mt-2'>{uploadError}</p>
        )}
        <p className='text-xs text-slate-500 mt-3 font-medium uppercase tracking-widest text-center'>
          Tap to Upload Photo
        </p>
      </div>

      <div className='space-y-6'>
        <div>
          <label className='block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-2'>
            Bucket List Top Pick 🌍
          </label>
          <input
            type='text'
            value={bucketList}
            onChange={(e) => setBucketList(e.target.value)}
            className='w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:bg-slate-700 focus:border-amber-500 transition-all placeholder:text-slate-600 text-white'
            placeholder='e.g. Kyoto, Japan'
          />
        </div>

        <button
          onClick={() => handleUpdateProfile("DNA")}
          disabled={isUploading || isSubmitting}
          className='w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
        >
          {isSubmitting ? (
            <Loader2 className='w-6 h-6 animate-spin mx-auto' />
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </motion.div>
  );
};
