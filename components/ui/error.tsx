import { X } from "lucide-react";
import { useState } from "react";

interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className='relative rounded-md bg-red-50 p-3 text-red-800 border border-red-200 flex items-center justify-between'>
      <p className='text-sm font-medium'>{message}</p>
      <button
        onClick={() => setVisible(false)}
        className='ml-3 inline-flex items-center justify-center rounded-full p-1 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500'
      >
        <X className='h-4 w-4' />
      </button>
    </div>
  );
}
