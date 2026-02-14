import { X } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { joinGroupSchema, TJoinGroupSchema } from "./joinGroupZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useJoinGroup } from "@/src/hooks/useGroups";
import { useRouter } from "next/navigation";

interface IJoinGroupModalProps {
  onClose: () => void;
}
const JoinGroupModal = ({ onClose }: IJoinGroupModalProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
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
        groupCode: values.groupCode,
      });
      onClose();
      // Navigate to the joined group
      if (result.group) {
        router.push(`/group/${result.group.id}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || "Failed to join group";
      setError(message);
    }
  };
  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300'>
      <div className='bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden'>
        {/* Background Gradients */}
        <div className='absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none'></div>
        <div className='absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none'></div>

        {/* Header */}
        <div className='p-6 border-b border-white/5 flex items-center justify-between relative z-10'>
          <div>
            <h2 className='text-2xl font-bold text-white'>Join Group</h2>
            <p className='text-sm text-slate-400 mt-1'>
              Enter group code to join
            </p>
          </div>
          <button
            onClick={onClose}
            className='w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Form */}
        <div className='p-6 relative z-10'>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            <div className='space-y-2'>
              <Label
                htmlFor='code'
                className={`${
                  form.formState.errors.groupCode
                    ? "text-rose-400"
                    : "text-slate-300"
                } transition-colors`}
              >
                {form.formState.errors.groupCode
                  ? form.formState.errors.groupCode.message
                  : "Group Code"}
              </Label>
              <Input
                id='code'
                type='text'
                placeholder='e.g., ABC1234'
                {...form.register("groupCode")}
                className={`w-full px-4 py-3 rounded-xl bg-white/5 text-white placeholder-slate-500 border transition-all duration-200 ${
                  form.formState.errors.groupCode
                    ? "border-rose-500/50 focus-visible:border-rose-500 focus-visible:ring-rose-500/20"
                    : "border-white/10 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20"
                }`}
              />
              <p className='text-xs text-slate-500'>
                Ask your friends to share their group code
              </p>
            </div>

            {/* General Error Message */}
            {error && (
              <div className='p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm'>
                {error}
              </div>
            )}
            <div className='flex gap-3 pt-4'>
              <Button
                type='button'
                onClick={onClose}
                disabled={joinGroup.isPending}
                variant='outline'
                className='flex-1 bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl h-11'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={joinGroup.isPending}
                className='flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-xl h-11 shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed border-0'
              >
                {joinGroup.isPending ? "Joining..." : "Join"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinGroupModal;
