import { X } from "lucide-react";
import { useState } from "react";

interface SuccessAlertProps {
  message: string;
}
export function SuccessAlert({ message }: SuccessAlertProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className='relative rounded-md bg-green-50 p-3 text-green-800 border border-green-200 flex items-center justify-between'>
      <p className='text-sm font-medium'>{message}</p>
      <button
        onClick={() => setVisible(false)}
        className='ml-3 inline-flex items-center justify-center rounded-full p-1 text-green-600 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500'
      >
        <X className='h-4 w-4' />
      </button>
    </div>
  );
}
