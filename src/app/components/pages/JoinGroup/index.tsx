"use client";

import { Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useJoinGroup } from "@/src/hooks/useGroups";
import { AppShell } from "../../shared/AppShell/AppShell";
import NavigationLoader from "../../shared/NavigationLoader";
import { SUBMIT_BUTTON } from "../../shared/formStyles";

const CODE_LENGTH = 6;

const cleanCode = (value: string) => value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, CODE_LENGTH);

export default function JoinGroupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const joinGroup = useJoinGroup();

  const complete = code.length === CODE_LENGTH;
  const isLoading = joinGroup.isPending || isNavigating;

  const submit = async () => {
    if (!complete || isLoading) return;
    try {
      setError(null);
      const result = await joinGroup.mutateAsync({ groupCode: code });
      if (result.group) {
        setIsNavigating(true);
        // Small delay for feedback
        await new Promise((resolve) => setTimeout(resolve, 300));
        router.push(`/group/${result.group.id}`);
      }
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { error?: string } }; message?: string };
      setError(anyErr?.response?.data?.error || anyErr?.message || "Failed to join group");
      setIsNavigating(false);
    }
  };

  return (
    <AppShell level='detail' back={{ href: "/groups", crumb: "Groups" }}>
      {isNavigating && <NavigationLoader message='Connecting to group...' />}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className='mx-auto mt-[clamp(0px,4cqw,40px)] flex max-w-[520px] flex-col gap-[22px] rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[clamp(22px,3.5cqw,36px)] text-center shadow-[0_50px_100px_-50px_rgba(0,0,0,.9)]'
      >
        <div>
          <h1 className='mb-2 text-[clamp(28px,4.4cqw,36px)] font-extrabold tracking-[-.03em]'>Join a group</h1>
          <p className='text-[15px] text-[#94a3b8]'>Enter the 6-character code your friend shared.</p>
        </div>

        <label className='relative grid cursor-text grid-cols-6 gap-2'>
          {Array.from({ length: CODE_LENGTH }, (_, index) => {
            const active = index === Math.min(code.length, CODE_LENGTH - 1);
            return (
              <span
                key={index}
                className={cn(
                  "flex h-[58px] items-center justify-center rounded-xl border bg-[rgba(2,6,23,.6)] font-mono text-2xl font-semibold text-[#fbbf24]",
                  code[index] || active ? "border-[rgba(251,191,36,.45)]" : "border-white/[.1]",
                )}
              >
                {code[index] ?? ""}
              </span>
            );
          })}
          <input
            value={code}
            onChange={(event) => {
              setCode(cleanCode(event.target.value));
              setError(null);
            }}
            maxLength={CODE_LENGTH}
            autoComplete='off'
            autoCapitalize='characters'
            aria-label='Group code'
            className='absolute inset-0 size-full border-0 text-2xl opacity-0'
          />
        </label>

        {error ? (
          <div className='rounded-xl border border-[rgba(248,113,113,.3)] bg-[rgba(248,113,113,.08)] px-4 py-3 text-sm text-[#fecaca]'>
            {error}
          </div>
        ) : null}

        <button type='submit' disabled={!complete || isLoading} className={cn(SUBMIT_BUTTON, "mt-0")}>
          {isLoading ? <Loader2 className='size-5 animate-spin' /> : <Users className='size-5' />}
          Join group
        </button>

        <span className='font-mono text-[11px] text-[#64748b]'>Codes look like 7XK2QD</span>
      </form>
    </AppShell>
  );
}
