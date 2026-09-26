"use client";

import { motion } from "framer-motion";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { auth } from "@/lib/firebase";
import { EASE, useRevealDistance } from "../Site/motion";

import { FIELD_LABEL, INPUT, SUBMIT_BUTTON } from "../formStyles";

export { FIELD_LABEL, INPUT, SUBMIT_BUTTON };

interface AuthItemProps {
  /** Position in the page's entrance sequence; each item follows the previous one. */
  index: number;
  children: ReactNode;
  className?: string;
  /** Seconds the whole sequence waits before it starts. */
  start?: number;
  /** Seconds between items. */
  step?: number;
  duration?: number;
}

/** Fades and slides up in turn with the rest of the page, so the form builds itself top to bottom. */
export function AuthItem({ index, children, className, start = 0.05, step = 0.055, duration = 0.65 }: AuthItemProps) {
  const y = useRevealDistance(20);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay: start + index * step, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div role='alert' className='rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200'>
      {children}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <span className='text-[13px] text-[#f87171]'>{message}</span> : null;
}

interface PasswordFieldProps {
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: string;
  autoComplete: string;
  /** Sits opposite the label (e.g. "Forgot?"). */
  action?: ReactNode;
  /** Rendered under the input, inside the label (e.g. the strength meter). */
  footer?: ReactNode;
}

export function PasswordField({ label, placeholder, registration, error, autoComplete, action, footer }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className='flex flex-col gap-[7px]'>
      <span className={`flex items-center justify-between ${FIELD_LABEL}`}>
        {label}
        {action}
      </span>
      <span className='relative flex items-center'>
        <input
          {...registration}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${INPUT} pr-11`}
        />
        <button
          type='button'
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className='absolute right-2 flex size-[30px] cursor-pointer items-center justify-center text-[#64748b]'
        >
          {visible ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
        </button>
      </span>
      <FieldError message={error} />
      {footer}
    </label>
  );
}

export function OrDivider() {
  return (
    <div className='mb-5 flex items-center gap-[14px]'>
      <span className='h-px flex-1 bg-white/[.08]' />
      <span className='font-mono text-[10px] uppercase tracking-[.18em] text-[#475569]'>or</span>
      <span className='h-px flex-1 bg-white/[.08]' />
    </div>
  );
}

const GOOGLE_ERRORS: Record<string, string | null> = {
  "auth/popup-closed-by-user": null,
  "auth/cancelled-popup-request": null,
  "auth/popup-blocked": "Your browser blocked the Google window. Allow pop-ups and try again.",
  "auth/account-exists-with-different-credential":
    "An account with this email already exists. Sign in with your password instead.",
  "auth/operation-not-allowed": "Google sign-in isn't available yet.",
};

interface GoogleButtonProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function GoogleButton({ onSuccess, onError }: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      onSuccess();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const known = err?.code in GOOGLE_ERRORS ? GOOGLE_ERRORS[err.code] : undefined;
      if (known !== null) onError(known ?? "Couldn't sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type='button'
      onClick={signIn}
      disabled={loading}
      className='mb-5 flex w-full cursor-pointer items-center justify-center gap-[10px] rounded-xl border border-white/[.14] bg-white/[.04] p-[14px] text-[15px] font-semibold text-[#e2e8f0] hover:bg-white/[.08] disabled:cursor-not-allowed disabled:opacity-60'
    >
      <span className='flex size-[18px] items-center justify-center rounded-full bg-white text-[11px] font-extrabold text-[#0f172a]'>
        G
      </span>
      Continue with Google
    </button>
  );
}
