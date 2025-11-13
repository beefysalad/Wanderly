import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  loginSchema,
  registrationSchema,
  TLoginSchema,
  TRegistrationSchema,
} from "./authZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { X, Mail, Lock, UserIcon, LogIn, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IAuthModalProps {
  onClose: () => void;
  defaultTab?: "signin" | "signup";
}

const AuthModal = ({ onClose, defaultTab = "signin" }: IAuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);
  const loginForm = useForm<TLoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const signUpForm = useForm<TRegistrationSchema>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const onLoginSubmit = (data: TLoginSchema) => {
    console.log(data);
  };
  const onSignUpSubmit = (data: TRegistrationSchema) => {
    console.log(data);
  };

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
            <form
              onSubmit={loginForm.handleSubmit(onLoginSubmit)}
              className='space-y-5'
            >
              <div className='space-y-2'>
                <Label
                  htmlFor='login-email'
                  className={`${
                    loginForm.formState.errors.email
                      ? "text-red-400"
                      : "text-slate-300"
                  } transition-colors`}
                >
                  {loginForm.formState.errors.email
                    ? loginForm.formState.errors.email.message
                    : "Email"}
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
                  <Input
                    id='login-email'
                    type='email'
                    placeholder='your@email.com'
                    {...loginForm.register("email")}
                    className={`transition-colors duration-200 pl-10 bg-slate-800 text-white placeholder:text-slate-500 
                        border ${
                          loginForm.formState.errors.email
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
                    loginForm.formState.errors.password
                      ? "text-red-400"
                      : "text-slate-300"
                  } transition-colors`}
                >
                  {loginForm.formState.errors.password
                    ? loginForm.formState.errors.password.message
                    : "Password"}
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
                  <Input
                    id='login-password'
                    type='password'
                    placeholder='Enter your password'
                    {...loginForm.register("password")}
                    className={`transition-colors duration-200 pl-10 bg-slate-800 text-white placeholder:text-slate-500 
                        border ${
                          loginForm.formState.errors.password
                            ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                            : "border-slate-700 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                        }`}
                  />
                </div>
              </div>

              <Button
                type='submit'
                className='w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2'
              >
                <LogIn className='w-5 h-5' />
                Sign In
              </Button>
            </form>
          )}

          {/* Sign Up Form */}
          {activeTab === "signup" && (
            <form
              onSubmit={signUpForm.handleSubmit(onSignUpSubmit)}
              className='space-y-5'
            >
              <div className='space-y-2'>
                <Label
                  htmlFor='name'
                  className={`${
                    signUpForm.formState.errors.name
                      ? "text-red-400"
                      : "text-slate-300"
                  } transition-colors`}
                >
                  {signUpForm.formState.errors.name
                    ? signUpForm.formState.errors.name.message
                    : "Full Name"}
                </Label>
                <div className='relative'>
                  <UserIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
                  <Input
                    id='name'
                    type='text'
                    placeholder='John Patrick Ryan'
                    {...signUpForm.register("name")}
                    className={`transition-colors duration-200 pl-10 bg-slate-800 text-white placeholder:text-slate-500 
                        border ${
                          signUpForm.formState.errors.name
                            ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                            : "border-slate-700 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                        }`}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='signup-email'
                  className={`${
                    signUpForm.formState.errors.email
                      ? "text-red-400"
                      : "text-slate-300"
                  } transition-colors`}
                >
                  {signUpForm.formState.errors.email
                    ? signUpForm.formState.errors.email.message
                    : "Email Address"}
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
                  <Input
                    id='signup-email'
                    type='email'
                    placeholder='your@email.com'
                    {...signUpForm.register("email")}
                    className={`transition-colors duration-200 pl-10 bg-slate-800 text-white placeholder:text-slate-500 
                        border ${
                          signUpForm.formState.errors.email
                            ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                            : "border-slate-700 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                        }`}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='signup-password'
                  className={`${
                    signUpForm.formState.errors.password
                      ? "text-red-400"
                      : "text-slate-300"
                  } transition-colors`}
                >
                  {signUpForm.formState.errors.password
                    ? signUpForm.formState.errors.password.message
                    : "Password"}
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
                  <Input
                    id='signup-password'
                    type='password'
                    placeholder='Min. 8 characters'
                    {...signUpForm.register("password")}
                    className={`transition-colors duration-200 pl-10 bg-slate-800 text-white placeholder:text-slate-500 
                        border ${
                          signUpForm.formState.errors.password
                            ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                            : "border-slate-700 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                        }`}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='signup-password'
                  className={`${
                    signUpForm.formState.errors.confirmPassword
                      ? "text-red-400"
                      : "text-slate-300"
                  } transition-colors`}
                >
                  {signUpForm.formState.errors.confirmPassword
                    ? signUpForm.formState.errors.confirmPassword.message
                    : "Confirm Password"}
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
                  <Input
                    id='confirm-password'
                    type='password'
                    placeholder='Re-enter password'
                    {...signUpForm.register("confirmPassword")}
                    className={`transition-colors duration-200 pl-10 bg-slate-800 text-white placeholder:text-slate-500 
                        border ${
                          signUpForm.formState.errors.confirmPassword
                            ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                            : "border-slate-700 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                        }`}
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
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
