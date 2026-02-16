"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { signUpSchema, TSignUpSchema } from "./authSchema";
import { Button } from "@/components/ui/button";

interface ISignUpFormProps {
  onAuthSuccess: () => void;
}

export default function SignUpForm({ onAuthSuccess }: ISignUpFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<TSignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: TSignUpSchema) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );

      // 2. Update profile with name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: values.name,
        });
      }

      onAuthSuccess();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Sign up error:", err);
      let message = "Failed to create account. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        message = "Email is already in use.";
      } else if (err.code === "auth/weak-password") {
        message = "Password is too weak.";
      } else if (err.code === "auth/invalid-email") {
        message = "Invalid email address.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
      {error && (
        <div className='bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-200'>
          <AlertCircle className='w-5 h-5 mt-0.5 flex-shrink-0' />
          <span className='text-sm'>{error}</span>
        </div>
      )}

      <div className='space-y-5'>
        {/* Name Input */}
        <div className='space-y-2'>
          <label htmlFor='name' className='block text-sm font-medium text-slate-300 mb-2'>
            Full name
          </label>
          <input
            {...form.register("name")}
            id='name'
            type='text'
            placeholder='John Doe'
            className='w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 
                     focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
                     transition-all duration-200 hover:bg-white/[0.07]'
          />
          {form.formState.errors.name && (
            <p className='text-sm text-red-400 mt-1.5'>
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Email Input */}
        <div className='space-y-2'>
          <label htmlFor='email' className='block text-sm font-medium text-slate-300 mb-2'>
            Email address
          </label>
          <input
            {...form.register("email")}
            id='email'
            type='email'
            placeholder='you@example.com'
            className='w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 
                     focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
                     transition-all duration-200 hover:bg-white/[0.07]'
          />
          {form.formState.errors.email && (
            <p className='text-sm text-red-400 mt-1.5'>
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div className='space-y-2'>
          <label htmlFor='password' className='block text-sm font-medium text-slate-300 mb-2'>
            Password
          </label>
          <div className='relative'>
            <input
              {...form.register("password")}
              id='password'
              type={showPassword ? "text" : "password"}
              placeholder='Create a password'
              className='w-full px-4 py-3.5 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 
                       focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
                       transition-all duration-200 hover:bg-white/[0.07]'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1'
            >
              {showPassword ? (
                <EyeOff className='w-5 h-5' />
              ) : (
                <Eye className='w-5 h-5' />
              )}
              <span className='sr-only'>
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </button>
          </div>
          {form.formState.errors.password && (
            <p className='text-sm text-red-400 mt-1.5'>
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Input */}
        <div className='space-y-2'>
          <label htmlFor='confirmPassword' className='block text-sm font-medium text-slate-300 mb-2'>
            Confirm password
          </label>
          <div className='relative'>
            <input
              {...form.register("confirmPassword")}
              id='confirmPassword'
              type={showConfirmPassword ? "text" : "password"}
              placeholder='Confirm your password'
              className='w-full px-4 py-3.5 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 
                       focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
                       transition-all duration-200 hover:bg-white/[0.07]'
            />
            <button
              type='button'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1'
            >
              {showConfirmPassword ? (
                <EyeOff className='w-5 h-5' />
              ) : (
                <Eye className='w-5 h-5' />
              )}
              <span className='sr-only'>
                {showConfirmPassword ? "Hide password" : "Show password"}
              </span>
            </button>
          </div>
          {form.formState.errors.confirmPassword && (
            <p className='text-sm text-red-400 mt-1.5'>
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type='submit'
        disabled={loading}
        className='w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 
                 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 
                 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02]
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
      >
        {loading ? (
          <span className='flex items-center justify-center gap-2'>
            <Loader2 className='w-5 h-5 animate-spin' />
            Creating account...
          </span>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
}