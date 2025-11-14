import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Loader2, Lock, Mail, UserIcon, UserPlus } from "lucide-react";
import { Fragment } from "react";
import { useForm } from "react-hook-form";
import { syncUser } from "../authAction";
import { registrationSchema, TRegistrationSchema } from "../authZod";

const SignUpForm = () => {
  const queryClient = useQueryClient();
  const form = useForm<TRegistrationSchema>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const registerMutation = useMutation({
    mutationFn: async (values: TRegistrationSchema) => {
      const cred = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      await updateProfile(cred.user, { displayName: values.name });

      await syncUser();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["current-user"], data);
    },
  });
  const onSubmit = (values: TRegistrationSchema) =>
    registerMutation.mutate(values);
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
      <div className='space-y-2'>
        {registerMutation.error ? (
          <div className='p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm'>
            {(registerMutation.error as Error).message}
          </div>
        ) : null}
        <Label
          htmlFor='name'
          className={`${
            form.formState.errors.name ? "text-red-400" : "text-slate-300"
          } transition-colors`}
        >
          {form.formState.errors.name
            ? form.formState.errors.name.message
            : "Full Name"}
        </Label>
        <div className='relative'>
          <UserIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
          <Input
            id='name'
            type='text'
            placeholder='John Patrick Ryan'
            {...form.register("name")}
            className={`transition-colors duration-200 pl-10 bg-slate-800 text-white placeholder:text-slate-500 
                        border ${
                          form.formState.errors.name
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
            form.formState.errors.email ? "text-red-400" : "text-slate-300"
          } transition-colors`}
        >
          {form.formState.errors.email
            ? form.formState.errors.email.message
            : "Email Address"}
        </Label>
        <div className='relative'>
          <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
          <Input
            id='signup-email'
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
          htmlFor='signup-password'
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
            id='signup-password'
            type='password'
            placeholder='Min. 8 characters'
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

      <div className='space-y-2'>
        <Label
          htmlFor='confirm-password'
          className={`${
            form.formState.errors.confirmPassword
              ? "text-red-400"
              : "text-slate-300"
          } transition-colors`}
        >
          {form.formState.errors.confirmPassword
            ? form.formState.errors.confirmPassword.message
            : "Confirm Password"}
        </Label>
        <div className='relative'>
          <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
          <Input
            id='confirm-password'
            type='password'
            placeholder='Re-enter password'
            {...form.register("confirmPassword")}
            className={`transition-colors duration-200 pl-10 bg-slate-800 text-white placeholder:text-slate-500 
                        border ${
                          form.formState.errors.confirmPassword
                            ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                            : "border-slate-700 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                        }`}
          />
        </div>
      </div>

      <Button
        type='submit'
        disabled={registerMutation.isPending}
        className='w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2'
      >
        {registerMutation.isPending ? (
          <Fragment>
            <Loader2 className='w-4 h-4 animate-spin' /> <p>Signing up...</p>
          </Fragment>
        ) : (
          <Fragment>
            <UserPlus className='w-5 h-5' />
            Sign Up
          </Fragment>
        )}
      </Button>
    </form>
  );
};

export default SignUpForm;
