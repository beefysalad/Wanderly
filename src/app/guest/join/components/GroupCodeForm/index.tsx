import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { useForm } from "react-hook-form";
import { codeSchema, TCodeSchema } from "../quickJoinZod";
import { zodResolver } from "@hookform/resolvers/zod";

interface IGroupCodeForm {
  onClose: () => void;
  setStep: React.Dispatch<React.SetStateAction<"code" | "name">>;
  setGroupCode: React.Dispatch<React.SetStateAction<string>>;
}
const GroupCodeForm = ({ onClose, setStep, setGroupCode }: IGroupCodeForm) => {
  const form = useForm<TCodeSchema>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      code: "",
    },
  });
  const onSubmit = (data: TCodeSchema) => {
    setGroupCode(data.code);
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
          placeholder='Enter 6-digit code'
          className={`w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-mono text-center text-lg tracking-widest uppercase`}
        />
        <p className='text-xs text-slate-400'>
          Ask your friends to share their group code
        </p>
      </div>

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
          className='flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20'
        >
          Next
        </Button>
      </div>
    </form>
  );
};

export default GroupCodeForm;
