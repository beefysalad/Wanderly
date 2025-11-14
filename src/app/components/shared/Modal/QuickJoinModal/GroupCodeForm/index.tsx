import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { useForm } from "react-hook-form";
import { codeSchema, TCodeSchema } from "../quickJoinZod";
import { zodResolver } from "@hookform/resolvers/zod";

interface IGrouoCodeForm {
  onClose: () => void;
  setStep: React.Dispatch<React.SetStateAction<"code" | "name">>;
}
const GroupCodeForm = ({ onClose, setStep }: IGrouoCodeForm) => {
  const form = useForm<TCodeSchema>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      code: "",
    },
  });
  const onSubmit = (data: TCodeSchema) => {
    console.log(data);
    setStep("name");
  };
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
      <div className='space-y-2'>
        <Label
          htmlFor='code'
          className={`${
            form.formState.errors.code ? "text-red-400" : "text-slate-300"
          } transition-colors`}
        >
          {form.formState.errors.code
            ? form.formState.errors.code.message
            : "Code"}
        </Label>
        <Input
          id='code'
          type='text'
          {...form.register("code")}
          placeholder='e.g., ABC123'
          className={`transition-colors duration-200  bg-slate-800 text-white placeholder:text-slate-500 
            border ${
              form.formState.errors.code
                ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                : "border-slate-700 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
            }`}
        />
        <p className='text-xs text-slate-400'>
          Ask your friends to share their group code
        </p>
      </div>

      {/* {form.formState.errors.code && (
        <div className='p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm'>
          {form.formState.errors.code.message}
        </div>
      )} */}

      <div className='flex gap-3 pt-4'>
        <Button
          type='button'
          onClick={onClose}
          className='flex-1 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white'
        >
          Cancel
        </Button>
        <Button
          type='submit'
          className='flex-1 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
        >
          Next
        </Button>
      </div>
    </form>
  );
};

export default GroupCodeForm;
