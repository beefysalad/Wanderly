import React from "react";
import { IUserCredentials } from "../LandingPage";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Mail, Lock, LogIn } from "lucide-react";

interface ILoginFormProps {
  onClose: () => void;
  onLogin: (userCredentials: IUserCredentials) => void;
  onSwitchToSignup: () => void;
}

const loginSchema = z.object({
  email: z.string().email("Invalid Email Address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});
type TLoginSchema = z.infer<typeof loginSchema>;
const LoginForm = ({ onClose, onLogin, onSwitchToSignup }: ILoginFormProps) => {
  const form = useForm<TLoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = (data: TLoginSchema) => {
    console.log(data);
  };
  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      {/* Updated modal border color to amber */}
      <div className='bg-slate-900 border border-amber-500/20 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in duration-200'>
        {/* Header */}
        <div className='p-6 border-b border-slate-800 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-white'>Welcome Back</h2>
            <p className='text-sm text-slate-400 mt-1'>
              Login to continue your journey
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
        <form onSubmit={form.handleSubmit(onSubmit)} className='p-6 space-y-5'>
          {form.formState.errors.email?.message && (
            <div className='p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm'>
              {form.formState.errors.email?.message}
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='email' className='text-slate-300'>
              Email
            </Label>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
              {/* Updated focus colors to amber */}
              <Input
                id='email'
                type='email'
                placeholder='your@email.com'
                {...form.register("email")}
                className='pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password' className='text-slate-300'>
              Password
            </Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
              {/* Updated focus colors to amber */}
              <Input
                id='password'
                type='password'
                placeholder='Enter your password'
                {...form.register("password")}
                className='pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20'
              />
            </div>
          </div>

          {/* Updated button gradient to amber/orange */}
          <Button
            type='submit'
            className='w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2'
          >
            <LogIn className='w-5 h-5' />
            Login
          </Button>

          <div className='text-center text-sm text-slate-400'>
            Don&apos;t have an account? {/* Updated text color to amber */}
            <button
              type='button'
              onClick={onSwitchToSignup}
              className='text-amber-400 hover:text-amber-300 font-semibold transition'
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
