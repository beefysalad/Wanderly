import { X } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { joinGroupSchema, TJoinGroupSchema } from "./joinGroupZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface IJoinGroupModalProps {
  onClose: () => void;
}
const JoinGroupModal = ({ onClose }: IJoinGroupModalProps) => {
  const form = useForm<TJoinGroupSchema>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: {
      groupName: "",
    },
  });
  const onSubmit = (values: TJoinGroupSchema) => console.log(values);
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
                {...form.register("groupName")}
                className={`w-full px-3 py-2 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${
                  form.formState.errors.groupName
                    ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                    : "border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                }`}
              />
              <p className='text-xs text-slate-500'>
                Ask your friends to share their group code
              </p>
            </div>

            {/* Error Message */}
            {form.formState.errors.groupName && (
              <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
                {form.formState.errors.groupName.message}
              </div>
            )}
            <div className='flex gap-3 pt-4'>
              <Button
                type='button'
                onClick={onClose}
                variant='outline'
                className='flex-1 bg-transparent'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
              >
                Next
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinGroupModal;
