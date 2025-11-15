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
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in duration-200'>
        {/* Header */}
        <div className='p-6 border-b border-slate-200 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-slate-900'>Join Group</h2>
            <p className='text-sm text-slate-600 mt-1'>
              Enter group code to join
            </p>
          </div>
          <button
            onClick={onClose}
            className='w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Form */}
        <div className='p-6'>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='code' className='text-slate-700'>
                Group Code
              </Label>
              <Input
                id='code'
                type='text'
                placeholder='e.g., ABC123'
                {...form.register("groupCode")}
                className={`w-full px-3 py-2 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${
                  form.formState.errors.groupCode
                    ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                    : "border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                }`}
              />
              <p className='text-xs text-slate-500'>
                Ask your friends to share their group code
              </p>
            </div>

            {/* Error Messages */}
            {form.formState.errors.groupCode && (
              <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
                {form.formState.errors.groupCode.message}
              </div>
            )}
            {error && (
              <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
                {error}
              </div>
            )}
            <div className='flex gap-3 pt-4'>
              <Button
                type='button'
                onClick={onClose}
                disabled={joinGroup.isPending}
                variant='outline'
                className='flex-1 bg-transparent'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={joinGroup.isPending}
                className='flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed'
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
