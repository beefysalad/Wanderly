"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { auth } from "@/lib/firebase";
import { AuthItem, FIELD_LABEL, FieldError, FormError, GoogleButton, INPUT, OrDivider, PasswordField, SUBMIT_BUTTON } from "./AuthParts";
import { signInSchema, type TSignInSchema } from "./authSchema";

interface ISignInFormProps {
  onAuthSuccess: () => void;
  /** Where "Start free" leads (keeps any ?redirect= the visitor arrived with). */
  signUpHref: string;
  /** Position of the heading in the page's entrance sequence; the form's items follow it. */
  firstIndex: number;
}

const SIGN_IN_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Invalid email or password.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
};

export default function SignInForm({ onAuthSuccess, signUpHref, firstIndex }: ISignInFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<TSignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const errors = form.formState.errors;

  const onSubmit = async (values: TSignInSchema) => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      onAuthSuccess();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(SIGN_IN_ERRORS[err.code] ?? "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    setError(null);
    setNotice(null);
    const email = form.getValues("email").trim();
    if (!signInSchema.shape.email.safeParse(email).success) {
      setError("Enter your email above first, then choose Forgot.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      // Deliberately not surfaced: the message below is the same whether or not the account exists.
      console.error("Password reset error:", err);
    }
    setNotice("If an account exists for that email, a reset link is on its way.");
  };

  return (
    <div className='w-full max-w-[420px]'>
      <AuthItem index={firstIndex}>
        <h1 className='mb-2 text-[clamp(30px,3.6vw,42px)] font-extrabold leading-[1.05] tracking-[-.03em]'>
          Welcome back.
        </h1>
      </AuthItem>
      <AuthItem index={firstIndex + 1}>
        <p className='mb-[30px] text-[15px] text-[#94a3b8]'>The trip&apos;s still there. Nobody moved anything important.</p>
      </AuthItem>

      <AuthItem index={firstIndex + 2}>
        <GoogleButton onSuccess={onAuthSuccess} onError={setError} />
      </AuthItem>
      <AuthItem index={firstIndex + 3}>
        <OrDivider />
      </AuthItem>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className='flex flex-col gap-[14px]'>
        {error ? <FormError>{error}</FormError> : null}
        {notice ? (
          <div role='status' className='rounded-xl border border-[rgba(52,211,153,.25)] bg-[rgba(52,211,153,.08)] px-4 py-3 text-sm text-[#34d399]'>
            {notice}
          </div>
        ) : null}

        <AuthItem index={firstIndex + 4}>
          <label className='flex flex-col gap-[7px]'>
            <span className={FIELD_LABEL}>Email</span>
            <input {...form.register("email")} type='email' autoComplete='email' placeholder='you@example.com' className={INPUT} />
            <FieldError message={errors.email?.message} />
          </label>
        </AuthItem>

        <AuthItem index={firstIndex + 5}>
          <PasswordField
            label='Password'
            placeholder='••••••••'
            autoComplete='current-password'
            registration={form.register("password")}
            error={errors.password?.message}
            action={
              <button
                type='button'
                onClick={onForgotPassword}
                className='cursor-pointer font-sans text-xs normal-case tracking-normal text-[#fbbf24] hover:text-[#fcd34d]'
              >
                Forgot?
              </button>
            }
          />
        </AuthItem>

        <AuthItem index={firstIndex + 6}>
          <button type='submit' disabled={loading} className={SUBMIT_BUTTON}>
            {loading ? (
              <>
                <Loader2 className='size-[17px] animate-spin' /> Signing in…
              </>
            ) : (
              <>
                Login <ArrowRight className='size-[17px]' />
              </>
            )}
          </button>
        </AuthItem>
      </form>

      <AuthItem
        index={firstIndex + 7}
        className='mt-7 flex flex-wrap justify-between gap-3 border-t border-white/[.07] pt-[22px] text-sm text-[#94a3b8]'
      >
        <span>
          New here?{" "}
          <Link href={signUpHref} className='font-semibold text-[#fbbf24] hover:text-[#fcd34d]'>
            Start free
          </Link>
        </span>
        <Link href='/guest/join' className='text-[#94a3b8]'>
          Join with a code
        </Link>
      </AuthItem>
    </div>
  );
}
