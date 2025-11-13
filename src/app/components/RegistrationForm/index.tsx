"use client";
import React, { useState } from "react";
import { IUserCredentials } from "../LandingPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Mail, Lock, UserIcon, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

interface IRegistrationFormProps {
  onClose: () => void;
  onRegister: (userCredentials: IUserCredentials) => void;
  onSwitchToLogin: () => void;
}

const registrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
});
type TRegistrationSchema = z.infer<typeof registrationSchema>;
const RegistrationForm = ({
  onClose,
  onRegister,
  onSwitchToLogin,
}: IRegistrationFormProps) => {
  const form = useForm<TRegistrationSchema>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const onSubmit = (data: TRegistrationSchema) => {
    console.log(data);
  };
  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-slate-900 border border-amber-500/20 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in duration-200'>
        {/* Header */}
        <div className='p-6 border-b border-slate-800 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-white'>Create Account</h2>
            <p className='text-sm text-slate-400 mt-1'>
              Start planning your adventures today
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
          {form.formState.errors.name?.message && (
            <div className='p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm'>
              {form.formState.errors.name?.message}
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='name' className='text-slate-300'>
              Full Name
            </Label>
            <div className='relative'>
              <UserIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
              <Input
                id='name'
                type='text'
                placeholder='John Doe'
                {...form.register("name")}
                className='pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email' className='text-slate-300'>
              Email
            </Label>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
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
              <Input
                id='password'
                type='password'
                placeholder='Min. 6 characters'
                {...form.register("password")}
                className='pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirmPassword' className='text-slate-300'>
              Confirm Password
            </Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
              <Input
                id='confirmPassword'
                type='password'
                placeholder='Re-enter password'
                {...form.register("confirmPassword")}
                className='pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20'
              />
            </div>
          </div>

          <Button
            type='submit'
            className='w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2'
          >
            <UserPlus className='w-5 h-5' />
            Sign Up
          </Button>

          <div className='text-center text-sm text-slate-400'>
            Already have an account?{" "}
            <button
              type='button'
              onClick={onSwitchToLogin}
              className='text-amber-400 hover:text-amber-300 font-semibold transition'
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
