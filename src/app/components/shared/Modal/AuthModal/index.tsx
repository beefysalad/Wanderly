import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, UserIcon, UserPlus, X } from "lucide-react";
import { useState } from "react";
import SignInForm from "./SIgnInForm";
import SignUpForm from "./SignUpForm";

interface IAuthModalProps {
  onClose: () => void;
  defaultTab?: "signin" | "signup";
  onAuthSuccess?: () => void;
}

const AuthModal = ({
  onClose,
  defaultTab = "signin",
  onAuthSuccess,
}: IAuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='relative bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-800/50 animate-in fade-in duration-200'>
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition shadow-lg'
        >
          <X className='w-5 h-5' />
        </button>

        {/* Tabs */}
        <div className='flex border-b border-slate-800'>
          <button
            onClick={() => setActiveTab("signin")}
            className={`flex-1 py-4 text-center font-medium transition-all ${
              activeTab === "signin"
                ? "text-white border-b-2 border-amber-500"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-4 text-center font-medium transition-all ${
              activeTab === "signup"
                ? "text-white border-b-2 border-amber-500"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          {/* Header */}
          <div className='text-center mb-6'>
            <h2 className='text-2xl font-bold text-white mb-2'>
              {activeTab === "signin" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className='text-sm text-slate-400'>
              {activeTab === "signin"
                ? "Sign in to continue your journey"
                : "Start planning your adventures today"}
            </p>
          </div>

          {/* Sign In Form */}
          {activeTab === "signin" && (
            <SignInForm onAuthSuccess={onAuthSuccess} />
          )}

          {/* Sign Up Form */}
          {activeTab === "signup" && (
            <SignUpForm onAuthSuccess={onAuthSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
