"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { auth } from "@/lib/firebase";
import { AuthItem, FIELD_LABEL, FieldError, FormError, GoogleButton, INPUT, OrDivider, PasswordField, SUBMIT_BUTTON } from "./AuthParts";
import { passwordStrength, signUpSchema, type TSignUpSchema } from "./authSchema";

interface ISignUpFormProps {
  onAuthSuccess: () => void;
  /** Where "Login" leads (keeps any ?redirect= the visitor arrived with). */
  loginHref: string;
  /** Position of the heading in the page's entrance sequence; the form's items follow it. */
  firstIndex: number;
}

const SIGN_UP_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "Email is already in use.",
  "auth/weak-password": "Password is too weak.",
  "auth/invalid-email": "Invalid email address.",
};

const STRENGTH_COLORS = ["", "bg-[#f87171]", "bg-[#fbbf24]", "bg-[#34d399]"];

function StrengthMeter({ password }: { password: string }) {
  const score = passwordStrength(password);

  return (
    <span className='mt-[3px] flex gap-[5px]' aria-hidden>
      {[1, 2, 3].map((level) => (
        <span
          key={level}
          className={`h-[3px] flex-1 rounded-full ${score >= level ? STRENGTH_COLORS[score] : "bg-white/[.08]"}`}
        />
      ))}
    </span>
  );
}

export default function SignUpForm({ onAuthSuccess, loginHref, firstIndex }: ISignUpFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<TSignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const errors = form.formState.errors;
  const password = form.watch("password");

  const onSubmit = async (values: TSignUpSchema) => {
    setLoading(true);
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      if (credential.user) {
        await updateProfile(credential.user, { displayName: values.name });
      }
      onAuthSuccess();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(SIGN_UP_ERRORS[err.code] ?? "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full max-w-[420px]'>
      <AuthItem index={firstIndex} duration={0.6}>
        <h1 className='mb-[10px] text-[clamp(30px,3.6vw,42px)] font-extrabold leading-[1.05] tracking-[-.03em]'>
          Start free.
        </h1>
      </AuthItem>
      <AuthItem index={firstIndex + 1} duration={0.6}>
        <p className='mb-[30px] text-[15px] leading-[1.65] text-[#94a3b8]'>
          Two minutes to your first trip. No card, no trial timer, no upsell email at 9am.
        </p>
      </AuthItem>

      <AuthItem index={firstIndex + 2} duration={0.6}>
        <GoogleButton onSuccess={onAuthSuccess} onError={setError} />
      </AuthItem>
      <AuthItem index={firstIndex + 3} duration={0.6}>
        <OrDivider />
      </AuthItem>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className='flex flex-col gap-[14px]'>
        {error ? <FormError>{error}</FormError> : null}

        <AuthItem index={firstIndex + 4} duration={0.6}>
          <label className='flex flex-col gap-[7px]'>
            <span className={FIELD_LABEL}>Your name</span>
            <input {...form.register("name")} type='text' autoComplete='name' placeholder='Maya Jimenez' className={INPUT} />
            <FieldError message={errors.name?.message} />
          </label>
        </AuthItem>

        <AuthItem index={firstIndex + 5} duration={0.6}>
          <label className='flex flex-col gap-[7px]'>
            <span className={FIELD_LABEL}>Email</span>
            <input {...form.register("email")} type='email' autoComplete='email' placeholder='you@example.com' className={INPUT} />
            <FieldError message={errors.email?.message} />
          </label>
        </AuthItem>

        <AuthItem index={firstIndex + 6} duration={0.6}>
          <PasswordField
            label='Password'
            placeholder='At least 8 characters'
            autoComplete='new-password'
            registration={form.register("password")}
            error={errors.password?.message}
            footer={<StrengthMeter password={password} />}
          />
        </AuthItem>

        <AuthItem index={firstIndex + 7} duration={0.6}>
          <button type='submit' disabled={loading} className={SUBMIT_BUTTON}>
            {loading ? (
              <>
                <Loader2 className='size-[17px] animate-spin' /> Creating account…
              </>
            ) : (
              <>
                Create my account <ArrowRight className='size-[17px]' />
              </>
            )}
          </button>
        </AuthItem>

        <AuthItem index={firstIndex + 8} duration={0.6}>
          <p className='mt-[6px] text-xs leading-[1.6] text-[#64748b]'>
            By signing up you agree to the terms and the privacy policy. We email you about your trips, and nothing
            else.
          </p>
        </AuthItem>
      </form>

      <AuthItem
        index={firstIndex + 9}
        duration={0.6}
        className='mt-7 flex flex-wrap justify-between gap-[10px] border-t border-white/[.07] pt-[22px] text-sm text-[#94a3b8]'
      >
        <span>
          Already have an account?{" "}
          <Link href={loginHref} className='font-semibold text-[#fbbf24] hover:text-[#fcd34d]'>
            Login
          </Link>
        </span>
        <Link href='/guest/join' className='text-[#94a3b8]'>
          Just have a code?
        </Link>
      </AuthItem>
    </div>
  );
}
