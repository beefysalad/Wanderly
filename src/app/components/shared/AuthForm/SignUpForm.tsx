"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, Mail, Lock, User, AlertCircle } from "lucide-react";
import { signUpSchema, TSignUpSchema } from "./authSchema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ISignUpFormProps {
  onAuthSuccess: () => void;
}

export default function SignUpForm({ onAuthSuccess }: ISignUpFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
      {error && (
        <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 text-red-200 text-sm'>
          <AlertCircle className='w-4 h-4 mt-0.5 flex-shrink-0' />
          <span>{error}</span>
        </div>
      )}

      <div className='space-y-2'>
        <div className='relative'>
          <User className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
          <Input
            {...form.register("name")}
            type='text'
            placeholder='Full Name'
            className='pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500'
          />
        </div>
        {form.formState.errors.name && (
          <p className='text-xs text-red-400 pl-1'>
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className='space-y-2'>
        <div className='relative'>
          <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
          <Input
            {...form.register("email")}
            type='email'
            placeholder='Email address'
            className='pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500'
          />
        </div>
        {form.formState.errors.email && (
          <p className='text-xs text-red-400 pl-1'>
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className='space-y-2'>
        <div className='relative'>
          <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
          <Input
            {...form.register("password")}
            type='password'
            placeholder='Password'
            className='pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500'
          />
        </div>
        {form.formState.errors.password && (
          <p className='text-xs text-red-400 pl-1'>
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className='space-y-2'>
        <div className='relative'>
          <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
          <Input
            {...form.register("confirmPassword")}
            type='password'
            placeholder='Confirm Password'
            className='pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500'
          />
        </div>
        {form.formState.errors.confirmPassword && (
          <p className='text-xs text-red-400 pl-1'>
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type='submit'
        disabled={loading}
        className='w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium py-2 rounded-lg transition-all shadow-lg shadow-orange-500/20'
      >
        {loading ? (
          <>
            <Loader2 className='w-4 h-4 animate-spin mr-2' />
            Creating account...
          </>
        ) : (
          "Sign Up"
        )}
      </Button>
    </form>
  );
}
