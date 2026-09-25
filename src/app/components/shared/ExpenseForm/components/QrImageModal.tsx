import Image from "next/image";
import { X } from "lucide-react";

interface IQrImageModalProps {
  src: string;
  onClose: () => void;
}

export const QrImageModal = ({ src, onClose }: IQrImageModalProps) => {
  return (
    <div
      className='fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm'
      onClick={() => onClose()}
    >
      <div className='relative max-w-2xl w-full max-h-[90vh]'>
        <button
          onClick={() => onClose()}
          className='absolute -top-12 right-0 text-white/70 hover:text-white transition-colors'
        >
          <X className='w-8 h-8' />
        </button>
        <Image
          src={src}
          alt='QR Code Full'
          width={800}
          height={800}
          className='object-contain w-full h-full rounded-2xl'
        />
      </div>
    </div>
  );
};
