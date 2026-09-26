import { X } from "lucide-react";

interface IQrImageModalProps {
  src: string;
  onClose: () => void;
}

export const QrImageModal = ({ src, onClose }: IQrImageModalProps) => {
  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4' onClick={onClose} role='dialog' aria-modal>
      <div className='relative w-full max-w-md' onClick={(event) => event.stopPropagation()}>
        <button
          type='button'
          aria-label='Close'
          onClick={onClose}
          className='absolute -top-12 right-0 cursor-pointer text-white/70 hover:text-white'
        >
          <X className='size-8' />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt='QR code' className='max-h-[80vh] w-full rounded-2xl bg-white object-contain' />
      </div>
    </div>
  );
};
