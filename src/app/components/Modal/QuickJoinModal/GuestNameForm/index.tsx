import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { guestNameSchema, TGuestSchema } from "../quickJoinZod";
import { zodResolver } from "@hookform/resolvers/zod";

interface IGuestNameForm {
  setStep: React.Dispatch<React.SetStateAction<"code" | "name">>;
}
const GuestNameForm = ({ setStep }: IGuestNameForm) => {
  const form = useForm<TGuestSchema>({
    resolver: zodResolver(guestNameSchema),
    defaultValues: {
      name: "",
    },
  });
  const onSubmit = (data: TGuestSchema) => {
    console.log(data);
  };
  const handleBack = () => {
    setStep("code");
  };
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
      <div className='space-y-2'>
        <Label
          htmlFor='guestName'
          className={`${
            form.formState.errors.name ? "text-red-400" : "text-slate-300"
          } transition-colors`}
        >
          {form.formState.errors.name
            ? form.formState.errors.name.message
            : "Guest Name"}
        </Label>
        <div className='relative'>
          <Users className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500' />
          <Input
            id='guestName'
            type='text'
            placeholder='Enter your name'
            {...form.register("name")}
            className={`transition-colors duration-200 pl-10 bg-slate-800 text-white placeholder:text-slate-500 
                border ${
                  form.formState.errors.name
                    ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                    : "border-slate-700 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                }`}
          />
        </div>
        <p className='text-xs text-slate-400'>
          You&apos;ll have view-only access to the group
        </p>
      </div>

      {/* {error && (
    <div className='p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm'>
      {error}
    </div>
  )} */}

      <div className='flex gap-3 pt-4'>
        <Button
          type='button'
          className='flex-1 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white'
          onClick={handleBack}
        >
          Back
        </Button>
        <Button
          type='submit'
          className='flex-1 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
        >
          Join as Guest
        </Button>
      </div>
    </form>
  );
};

export default GuestNameForm;
