import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, X } from "lucide-react";
import React, { useState } from "react";
import GroupCodeForm from "./GroupCodeForm";
import GuestNameForm from "./GuestNameForm";
interface IQuickJoinModalProps {
  onClose: () => void;
  onJoin: (code: string, guestName: string) => void;
}

const QuickJoinModal = ({ onClose, onJoin }: IQuickJoinModalProps) => {
  const [step, setStep] = useState<"code" | "name">("code");

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-slate-900 border border-emerald-500/20 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in duration-200'>
        {/* Header */}
        <div className='p-6 border-b border-slate-800 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-white'>Quick Join</h2>
            <p className='text-sm text-slate-400 mt-1'>
              View-only access to group plans
            </p>
          </div>
          <button
            onClick={onClose}
            className='w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Form */}
        <div className='p-6'>
          {step === "code" ? (
            <GroupCodeForm onClose={onClose} setStep={setStep} />
          ) : (
            <GuestNameForm setStep={setStep} />
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickJoinModal;
