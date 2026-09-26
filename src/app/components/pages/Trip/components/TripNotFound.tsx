import { useRouter } from "next/navigation";
import { AppShell } from "../../../shared/AppShell/AppShell";
import { PILL } from "../../../shared/Pills";

interface ITripNotFoundProps {
  groupId: string;
}

export const TripNotFound = ({ groupId }: ITripNotFoundProps) => {
  const router = useRouter();

  return (
    <AppShell level='detail' back={{ href: `/group/${groupId}`, crumb: "Back to group" }}>
      <div className='mx-auto max-w-md rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-10 text-center'>
        <h2 className='mb-2 text-xl font-bold'>Trip not found</h2>
        <p className='mb-6 text-[#94a3b8]'>This trip doesn&apos;t exist or has been removed.</p>
        <button type='button' onClick={() => router.push(`/group/${groupId}`)} className={PILL.ghost}>
          Go back to group
        </button>
      </div>
    </AppShell>
  );
};
