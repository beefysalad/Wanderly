import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { guestNameSchema, TGuestSchema } from "../quickJoinZod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/axios";
import { setGuestSession } from "@/lib/guest-session";
import { useRouter } from "next/navigation";

interface IGuestNameForm {
  setStep: React.Dispatch<React.SetStateAction<"code" | "name">>;
  groupCode: string;
}
const GuestNameForm = ({ setStep, groupCode }: IGuestNameForm) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TGuestSchema>({
    resolver: zodResolver(guestNameSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: TGuestSchema) => {
    setIsLoading(true);
    setError(null);

    const normalizedCode = groupCode.trim().toUpperCase();
    console.log("Attempting to validate group code:", normalizedCode);

    try {
      // Validate group code and get groupId
      console.log("Making API request to /groups/validate-code");
      const response = await api.post("/groups/validate-code", {
        code: normalizedCode,
      });

      console.log("API response received:", response.data);

      if (!response.data?.groupId) {
        throw new Error("Invalid response from server");
      }

      const { groupId } = response.data;

      // Store guest session
      setGuestSession(normalizedCode, data.name, groupId);

      // Navigate to guest group page
      router.push(`/guest/group/${groupId}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error joining group as guest:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        code: err.code,
      });
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Failed to join group. Please try again.";
      setError(errorMessage);
      setIsLoading(false);
    }
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

      {error && (
        <div className='p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm'>
          {error}
        </div>
      )}

      <div className='flex gap-3 pt-4'>
        <Button
          type='button'
          className='flex-1 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white'
          onClick={handleBack}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type='submit'
          className='flex-1 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
          disabled={isLoading}
        >
          {isLoading ? "Joining..." : "Join as Guest"}
        </Button>
      </div>
    </form>
  );
};

export default GuestNameForm;
