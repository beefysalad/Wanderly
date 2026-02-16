"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useJoinGroup } from "@/src/hooks/useGroups";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import NavigationLoader from "@/src/app/components/shared/NavigationLoader";

const joinGroupSchema = z.object({
  groupCode: z.string().min(5, "Group code must be at least 5 characters"),
});

type TJoinGroupSchema = z.infer<typeof joinGroupSchema>;

export default function JoinGroupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const joinGroup = useJoinGroup();

  const form = useForm<TJoinGroupSchema>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: {
      groupCode: "",
    },
  });

  const onSubmit = async (values: TJoinGroupSchema) => {
    try {
      setError(null);
      const result = await joinGroup.mutateAsync({
        groupCode: values.groupCode.toUpperCase(),
      });
      
      if (result.group) {
        setIsNavigating(true);
        // Small delay for feedback
        await new Promise((resolve) => setTimeout(resolve, 300));
        router.push(`/group/${result.group.id}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || "Failed to join group";
      setError(message);
      setIsNavigating(false);
    }
  };

  const isLoading = joinGroup.isPending || isNavigating;

  return (
    <main className='min-h-screen bg-slate-950 flex flex-col items-center p-4 sm:p-8 pt-12 relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-3xl opacity-20' />
        <div className='absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-500/5 rounded-full blur-3xl opacity-10' />
      </div>
      
      {isNavigating && <NavigationLoader message='Connecting to group...' />}

      <div className='w-full max-w-lg z-10'>
        {/* Modern Icon-Only Back Button - Integrated closer to content */}
        <div className='mb-8'>
          <button
            onClick={() => router.back()}
            className='p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all inline-flex items-center text-slate-400 hover:text-white group border border-white/5'
            aria-label='Go back'
          >
            <ArrowLeft className='w-5 h-5 transition-transform group-hover:-translate-x-0.5' />
          </button>
        </div>

        <div className='space-y-10'>
          {/* Header Typography - matching group/create exactly */}
          <div>
            <h1 className='text-4xl font-black text-white mb-2 tracking-tight'>
              Join Your <span className='text-orange-500'>Friends!</span>
            </h1>
            <p className='text-slate-400 text-lg'>
              Enter a group code to start planning your next journey together.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-10'>
            {/* Form Section - Clean, card-less layout sitting directly on background glow */}
            <div className='space-y-4'>
              <Label className='text-xs font-black uppercase text-slate-500 tracking-widest pl-1'>
                What is the secret code?
              </Label>
              <div className='relative'>
                <Input
                  id='groupCode'
                  type='text'
                  placeholder='e.g., ADVEN123'
                  {...form.register("groupCode")}
                  className={`h-16  pr-6 text-xl bg-slate-900 text-white border-white/5 focus:border-orange-500/50 rounded-2xl transition-all uppercase font-mono tracking-widest ${
                    form.formState.errors.groupCode
                      ? "border-red-500/50 focus:border-red-500"
                      : ""
                  }`}
                />
                {form.formState.errors.groupCode && (
                  <p className='text-red-400 text-sm mt-3 font-medium pl-1'>
                    {form.formState.errors.groupCode.message}
                  </p>
                )}
              </div>
              <p className='text-[10px] text-slate-500 uppercase tracking-widest font-black px-1 opacity-60'>
                Shared by your travel companions
              </p>
            </div>

            {/* General Error Message */}
            {error && (
              <div className='p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300'>
                <p className="opacity-90">{error}</p>
              </div>
            )}

            {/* Large High-Contrast Button */}
            <div className='flex gap-4'>
              <Button
                type='submit'
                disabled={isLoading}
                className='flex-1 py-8 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg h-16 rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 border-0'
              >
                {isLoading ? (
                  <Loader2 className='w-6 h-6 animate-spin' />
                ) : (
                  "Join Group"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
