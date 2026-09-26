"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { VIBES, getVibeInfo } from "@/lib/utils/groupColors";
import { useCreateGroup } from "@/src/hooks/useGroups";
import { createGroupSchema, type TCreateGroupSchema } from "@/src/app/group/create/createGroupZod";
import { AppShell } from "../../shared/AppShell/AppShell";
import { FIELD_ERROR, FIELD_LABEL, INPUT, SUBMIT_BUTTON } from "../../shared/formStyles";
import { GroupPreview } from "./GroupPreview";
import { VibeGrid } from "./VibeGrid";

export default function CreateGroupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const createGroup = useCreateGroup();

  const form = useForm<TCreateGroupSchema>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { groupName: "", colorScheme: "orange", emoji: null },
  });

  const groupName = form.watch("groupName");
  const colorScheme = form.watch("colorScheme") ?? "orange";
  const emoji = form.watch("emoji");
  const vibe = getVibeInfo(colorScheme);

  // Follow the vibe's default emoji, unless the user has set a custom one.
  useEffect(() => {
    if (!emoji || Object.values(VIBES).some((v) => v.emoji === emoji)) {
      form.setValue("emoji", vibe.emoji);
    }
  }, [vibe.emoji, emoji, form]);

  const onSubmit = async (values: TCreateGroupSchema) => {
    try {
      setError(null);
      const result = await createGroup.mutateAsync({
        name: values.groupName,
        colorScheme: values.colorScheme || "orange",
        emoji: values.emoji || null,
      });
      if (result.group) router.push(`/group/${result.group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    }
  };

  return (
    <AppShell level='detail' back={{ href: "/groups", crumb: "Groups" }}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-wrap items-start gap-8'>
        <div className='flex min-w-0 flex-[999_1_460px] flex-col gap-6'>
          <div>
            <h1 className='mb-2 text-[clamp(30px,4.6cqw,46px)] font-extrabold leading-none tracking-[-.035em]'>
              Start your <span className='text-[#fbbf24]'>adventure.</span>
            </h1>
            <p className='text-base text-[#94a3b8]'>Create a space for your group to plan and share memories.</p>
          </div>

          <label className='flex flex-col gap-[7px]'>
            <span className={FIELD_LABEL}>What should we call this group?</span>
            <input
              {...form.register("groupName")}
              placeholder='e.g. Paraluman'
              className={`${INPUT} !text-lg !font-semibold`}
            />
            {form.formState.errors.groupName ? (
              <span className={FIELD_ERROR}>{form.formState.errors.groupName.message}</span>
            ) : null}
          </label>

          <VibeGrid
            value={colorScheme}
            onChange={(key) => form.setValue("colorScheme", key as TCreateGroupSchema["colorScheme"])}
          />

          {error ? (
            <div className='rounded-xl border border-[rgba(248,113,113,.3)] bg-[rgba(248,113,113,.08)] px-4 py-3 text-sm text-[#fecaca]'>
              {error}
            </div>
          ) : null}

          <button type='submit' disabled={createGroup.isPending} className={SUBMIT_BUTTON}>
            {createGroup.isPending ? <Loader2 className='size-5 animate-spin' /> : null}
            Create group
          </button>
        </div>

        <GroupPreview name={groupName} emoji={emoji ?? null} vibeName={vibe.name} colorScheme={colorScheme} />
      </form>
    </AppShell>
  );
}
