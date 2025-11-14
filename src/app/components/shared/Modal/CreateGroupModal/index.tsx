import { HelpCircle, X } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { createGroupSchema, TCreateGroupSchema } from "./createGroupZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ICreateGroupModalProps {
  onClose: () => void;
}
const CreateGroupModal = ({ onClose }: ICreateGroupModalProps) => {
  const form = useForm<TCreateGroupSchema>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      groupName: "",
    },
  });
  const onSubmit = (values: TCreateGroupSchema) => console.log(values);
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
            Create Group
          </h2>
          <button
            onClick={onClose}
            className='p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-slate-500' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          {/* Group Name */}
          <div>
            <Label
              htmlFor='groupName'
              className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'
            >
              Group Name
            </Label>
            <Input
              id='groupName'
              type='text'
              {...form.register("groupName")}
              placeholder='e.g., Our Adventure 2025'
              className={`w-full px-3 py-2 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${
                form.formState.errors.groupName
                  ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                  : "border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
              }`}
            />
          </div>

          {/* Error Message */}
          {form.formState.errors.groupName && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {form.formState.errors.groupName.message}
            </div>
          )}

          {/* Buttons */}
          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 border bg-slate-150 border-slate-300 rounded-lg text-slate-700  font-medium hover:bg-slate-200  transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors'
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
