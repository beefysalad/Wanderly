"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { signInSchema, TSignInSchema } from "./authSchema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ISignInFormProps {
  onAuthSuccess: () => void;
}

export default function SignInForm({ onAuthSuccess }: ISignInFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<TSignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: TSignInSchema) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      onAuthSuccess();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Sign in error:", err);
      let message = "Failed to sign in. Please check your credentials.";
      if (err.code === "auth/invalid-credential") {
        message = "Invalid email or password.";
      } else if (err.code === "auth/user-not-found") {
        message = "No account found with this email.";
      } else if (err.code === "auth/wrong-password") {
        message = "Incorrect password.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many attempts. Please try again later.";
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

      <Button
        type='submit'
        disabled={loading}
        className='w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium py-2 rounded-lg transition-all shadow-lg shadow-orange-500/20'
      >
        {loading ? (
          <>
            <Loader2 className='w-4 h-4 animate-spin mr-2' />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
