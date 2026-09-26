import { Crown, Mail, User, Users } from "lucide-react";
import Image from "next/image";

interface MemberRow {
  email: string;
  displayName: string;
  isCreator: boolean;
  imageUrl?: string;
}

interface MembersListProps {
  members: MemberRow[];
}

function getInitials(email: string) {
  return email.substring(0, 2).toUpperCase();
}

export function MembersList({ members }: MembersListProps) {
  return (
    <section className='mb-6 border border-slate-800 rounded-2xl bg-slate-900 p-3 sm:p-4'>
      <h2 className='px-1 pb-3 text-sm font-semibold text-white'>Members</h2>

      {members.length === 0 ? (
        <div className='rounded-xl border border-dashed border-slate-700 p-8 text-center'>
          <Users className='mx-auto h-6 w-6 text-slate-500 mb-2' />
          <p className='text-sm text-slate-400'>No members yet.</p>
        </div>
      ) : (
        <div className='space-y-2'>
          {members.map((member) => (
            <div
              key={member.email}
              className='flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3'
            >
              {member.imageUrl ? (
                <div className='relative h-11 w-11 overflow-hidden rounded-full border border-slate-700'>
                  <Image
                    src={member.imageUrl}
                    alt={member.displayName}
                    fill
                    className='object-cover'
                  />
                </div>
              ) : (
                <div className='flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200'>
                  {member.email ? getInitials(member.email) : <User className='h-4 w-4' />}
                </div>
              )}

              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <p className='truncate text-sm font-medium text-white'>
                    {member.displayName}
                  </p>
                  {member.isCreator && (
                    <span className='inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300'>
                      <Crown className='h-3 w-3' />
                      Creator
                    </span>
                  )}
                </div>
                <div className='mt-0.5 flex items-center gap-1.5 text-xs text-slate-400'>
                  <Mail className='h-3.5 w-3.5' />
                  <span className='truncate'>{member.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
