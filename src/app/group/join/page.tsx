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
import { Users, Loader2 } from "lucide-react";
import NavigationLoader from "@/src/app/components/shared/NavigationLoader";
import PremiumBackground from "@/src/app/components/shared/PremiumBackground";
import PremiumPageHeader from "@/src/app/components/shared/PremiumPageHeader";

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
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyErr = err as any;
      const message =
        anyErr?.response?.data?.error || anyErr?.message || "Failed to join group";
      setError(message);
      setIsNavigating(false);
    }
  };

  const isLoading = joinGroup.isPending || isNavigating;

  return (
    <main className='min-h-screen bg-slate-950 pb-24 text-slate-200 relative overflow-x-hidden selection:bg-purple-500/30 font-sans'>
      <PremiumBackground />
      
      <PremiumPageHeader 
        title="Join Group" 
        onBack={() => router.back()}
      />
      
      {isNavigating && <NavigationLoader message='Connecting to group...' />}

      <div className='w-full max-w-lg mx-auto px-6 pt-12 relative z-10'>
        <div className='space-y-12'>
          {/* Header Typography */}
          <div>
            <h1 className='text-4xl font-black text-white mb-2 tracking-tight uppercase'>
              Join Your <span className='text-orange-500'>Friends!</span>
            </h1>
            <p className='text-slate-400 text-lg font-medium'>
              Enter a group code to start planning your next journey together.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-12'>
            {/* Form Section */}
            <div className='space-y-4'>
              <Label className='text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1'>
                What is the secret code?
              </Label>
              <div className='relative'>
                <Input
                  id='groupCode'
                  type='text'
                  placeholder='e.g., ADVEN123'
                  {...form.register("groupCode")}
                  className={`h-16 px-6 text-xl bg-white/5 border-white/5 focus:border-orange-500/50 rounded-2xl transition-all uppercase font-mono tracking-widest ${
                    form.formState.errors.groupCode
                      ? "border-red-500/50 focus:border-red-500"
                      : ""
                  }`}
                />
                {form.formState.errors.groupCode && (
                  <p className='text-red-400 text-sm mt-3 font-medium ml-1'>
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
              <div className='p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300'>
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* Large High-Contrast Button */}
            <div className='flex gap-4'>
              <Button
                type='submit'
                disabled={isLoading}
                className='flex-1 py-8 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg h-16 rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 border-0 uppercase tracking-widest'
              >
                {isLoading ? (
                  <Loader2 className='w-6 h-6 animate-spin' />
                ) : (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>Join Group</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
