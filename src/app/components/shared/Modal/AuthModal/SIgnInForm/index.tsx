import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, LogIn, Mail } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { loginSchema, TLoginSchema } from "../authZod";
import { zodResolver } from "@hookform/resolvers/zod";

const SignInForm = () => {
  const form = useForm<TLoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onLoginSubmit = (data: TLoginSchema) => {
    console.log(data);
  };
  return (
    <form onSubmit={form.handleSubmit(onLoginSubmit)} className='space-y-5'>
      <div className='space-y-2'>
        <Label
          htmlFor='login-email'
          className={`${
            form.formState.errors.email ? "text-red-400" : "text-slate-300"
          } transition-colors`}
        >
          {form.formState.errors.email
            ? form.formState.errors.email.message
            : "Email"}
        </Label>
        <div className='relative'>
          <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
          <Input
            id='login-email'
            type='email'
            placeholder='your@email.com'
            {...form.register("email")}
            className={`transition-colors duration-200 pl-10 bg-slate-800 text-white placeholder:text-slate-500 
            border ${
              form.formState.errors.email
                ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                : "border-slate-700 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
            }`}
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label
          htmlFor='login-password'
          className={`${
            form.formState.errors.password ? "text-red-400" : "text-slate-300"
          } transition-colors`}
        >
          {form.formState.errors.password
            ? form.formState.errors.password.message
            : "Password"}
        </Label>
        <div className='relative'>
          <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
          <Input
            id='login-password'
            type='password'
            placeholder='Enter your password'
            {...form.register("password")}
            className={`transition-colors duration-200 pl-10 bg-slate-800 text-white placeholder:text-slate-500 
            border ${
              form.formState.errors.password
                ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                : "border-slate-700 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
            }`}
          />
        </div>
      </div>

      <Button
        type='submit'
        className='w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2'
      >
        <LogIn className='w-5 h-5' />
        Sign In
      </Button>
    </form>
  );
};

export default SignInForm;
