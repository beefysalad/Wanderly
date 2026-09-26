"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { getVibeInfo } from "@/lib/utils/groupColors";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useGroup, useGroupAsGuest } from "@/src/hooks/useGroups";
import { AppShell } from "../../shared/AppShell/AppShell";
import { GuestShell } from "../../shared/AppShell/GuestShell";
import { StateCard } from "../../shared/AppShell/StateCard";
import LoadingState from "../../shared/LoadingState";
import { UserAvatar } from "../../shared/UserAvatar";
import { memberRows } from "./memberView";

interface IMembersComponent {
  groupId: string;
  /** Someone peeking in with a group code: read-only, without the invite card. */
  guest?: boolean;
}

const MembersComponent = ({ groupId, guest = false }: IMembersComponent) => {
  const { data: memberGroup, isLoading: loadingMember } = useGroup(guest ? null : groupId);
  const { data: guestGroup, isLoading: loadingGuest } = useGroupAsGuest(guest ? groupId : null);
  const { user } = useCurrentUser();
  const group = (guest ? guestGroup : memberGroup?.group) || null;
  const isLoading = guest ? loadingGuest : loadingMember;
  const back = {
    href: `${guest ? "/guest" : ""}/group/${groupId}`,
    crumb: `${group?.name ?? "Group"} · Members`,
  };
  const wrap = (children: ReactNode) =>
    guest ? (
      <GuestShell group={group} back={back}>
        {children}
      </GuestShell>
    ) : (
      <AppShell level='detail' back={back}>
        {children}
      </AppShell>
    );

  if (isLoading) {
    return wrap(<LoadingState className='py-24' />);
  }

  if (!group) {
    if (guest) {
      return (
        <GuestShell>
          <p className='py-16 text-center text-sm text-[#94a3b8]'>This group doesn&apos;t exist or has been removed.</p>
        </GuestShell>
      );
    }
    return <StateCard back={{ href: "/groups", crumb: "Groups" }} title='Group not found' />;
  }

  const rows = memberRows(group, user?.email ?? "");

  const copyCode = async () => {
    if (await copyToClipboard(group.code)) toast.success("Group code copied to clipboard!");
    else toast.error("Failed to copy group code");
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/invite/${group.code}`;
    if (await copyToClipboard(link))
      toast.success("Invite link copied!", { description: "Send it to your friend to join the group." });
    else toast.error("Failed to copy invite link");
  };

  return wrap(
    <>
      <div className='flex flex-col gap-[22px]'>
        <div>
          <p className='mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>
            {group.emoji || getVibeInfo(group.colorScheme).emoji} {group.name} · {rows.length}{" "}
            {rows.length === 1 ? "person" : "people"}
          </p>
          <h1 className='text-[clamp(28px,4.4cqw,40px)] font-extrabold leading-[1.05] tracking-[-.03em]'>Members</h1>
        </div>

        <div className='flex flex-wrap items-start gap-6'>
          <div className='min-w-0 flex-[999_1_440px] overflow-hidden rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)]'>
            {rows.map((row) => (
              <div
                key={row.email}
                className='flex items-center gap-[14px] border-t border-white/[.05] px-[18px] py-[14px] first:border-t-0'
              >
                <UserAvatar name={row.name} colorKey={row.email} imageUrl={row.imageUrl} className='size-10 text-xs' />
                <span className='flex min-w-0 flex-1 flex-col gap-[2px]'>
                  <span className='truncate text-[15px] font-semibold text-[#e2e8f0]'>
                    {row.name}
                    {row.isYou ? " (you)" : ""}
                  </span>
                  <span className='truncate text-xs text-[#64748b]'>{row.email}</span>
                </span>
                <span className='flex flex-none flex-col items-end gap-1'>
                  <span
                    className={cn(
                      "rounded-full border px-[9px] py-[3px] text-[11px] font-bold",
                      row.role === "Owner"
                        ? "border-[rgba(251,191,36,.35)] text-[#fbbf24]"
                        : "border-white/[.1] text-[#94a3b8]",
                    )}
                  >
                    {row.role}
                  </span>
                  {row.joined ? <span className='font-mono text-[10px] text-[#475569]'>{row.joined}</span> : null}
                </span>
              </div>
            ))}
          </div>

          {guest ? null : (
            <div className='flex min-w-0 flex-[1_1_280px] flex-col gap-[14px] rounded-[22px] border border-[rgba(245,158,11,.22)] bg-[rgba(245,158,11,.07)] p-[18px]'>
              <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#fcd34d]'>Invite people</span>
              <button
                type='button'
                onClick={copyCode}
                className='flex cursor-pointer items-center justify-between gap-[10px] rounded-[14px] border border-white/[.1] bg-[rgba(2,6,23,.6)] px-4 py-[14px] text-inherit'
              >
                <span className='font-mono text-2xl font-semibold tracking-[.16em] text-[#fbbf24]'>{group.code}</span>
                <span className='text-xs font-semibold text-[#cbd5e1]'>Copy code</span>
              </button>
              <button
                type='button'
                onClick={copyLink}
                className='cursor-pointer rounded-xl bg-[#fbbf24] p-3 text-sm font-bold text-[#0b0a06]'
              >
                Copy invite link
              </button>
              <span className='text-xs leading-[1.5] text-[#94a3b8]'>
                Anyone with the code can also peek in as a guest, read-only, without an account.
              </span>
            </div>
          )}
        </div>
      </div>
    </>,
  );
};

export default MembersComponent;
