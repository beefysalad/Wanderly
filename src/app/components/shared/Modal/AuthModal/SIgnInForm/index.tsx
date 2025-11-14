import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Loader2, Lock, LogIn, Mail } from "lucide-react";
import { Fragment } from "react";
import { useForm } from "react-hook-form";
import { syncUser } from "../authAction";
import { loginSchema, TLoginSchema } from "../authZod";

const SignInForm = () => {
  const form = useForm<TLoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const signInMutation = useMutation({
    mutationFn: async (values: TLoginSchema) => {
      await signInWithEmailAndPassword(auth, values.email, values.password);
    },
    onSuccess: async () => {
      await syncUser();
    },
    onError: (error) => {
      console.error("Sign in Error", error);
    },
  });

  const onSubmit = (values: TLoginSchema) => signInMutation.mutate(values);
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
      <div className='space-y-2'>
        {signInMutation.error ? (
          <div className='p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm'>
            {(signInMutation.error as Error).message}
          </div>
        ) : null}
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
        disabled={signInMutation.isPending}
        className='w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2'
      >
        {signInMutation.isPending ? (
          <Fragment>
            <Loader2 className='w-4 h-4 animate-spin' />
            <p>Signing in...</p>
          </Fragment>
        ) : (
          <Fragment>
            <LogIn className='w-5 h-5' />
            Sign In
          </Fragment>
        )}
      </Button>
    </form>
  );
};

export default SignInForm;
