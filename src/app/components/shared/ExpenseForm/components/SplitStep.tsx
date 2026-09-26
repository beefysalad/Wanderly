import { Plus, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/utils/money";
import { FIELD_ERROR, INPUT } from "../../formStyles";
import { UserAvatar } from "../../UserAvatar";
import type { TExpenseSchema } from "../expenseSchema";

interface ISplitStepProps {
  form: UseFormReturn<TExpenseSchema>;
  members: string[];
  getDisplayName: (email: string) => string;
  toggleMember: (member: string) => void;
  toggleSelectAll: () => void;
  guestName: string;
  setGuestName: (value: string) => void;
}

/** Step 2: tick who is in on it; each ticked person's share updates as you go. Guests can be added by name. */
export const SplitStep = ({ form, members, getDisplayName, toggleMember, toggleSelectAll, guestName, setGuestName }: ISplitStepProps) => {
  const splitWith = form.watch("splitWith");
  const amount = Number(form.watch("amount")) || 0;
  const per = splitWith.length ? amount / splitWith.length : 0;
  const guests = splitWith.filter((member) => !members.includes(member));

  const addGuest = () => {
    const name = guestName.trim();
    if (!name) return;
    toggleMember(name);
    setGuestName("");
  };

  const row = (key: string, name: string, selected: boolean, onToggle: () => void, note?: string) => (
    <button
      key={key}
      type='button'
      onClick={onToggle}
      aria-pressed={selected}
      className='flex w-full cursor-pointer items-center gap-3 border-t border-white/[.05] bg-transparent px-4 py-3 text-left text-inherit first:border-t-0'
    >
      <span
        className={cn(
          "box-border flex size-[22px] flex-none items-center justify-center rounded-[7px] border-2 text-xs font-extrabold text-[#160c02]",
          selected ? "border-[#fbbf24] bg-[#fbbf24]" : "border-[#475569]",
        )}
      >
        {selected ? "✓" : ""}
      </span>
      <UserAvatar name={name} colorKey={key} className='size-8 text-[10px]' />
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='truncate text-sm font-semibold text-[#e2e8f0]'>{name}</span>
        {note ? <span className='text-[10px] text-[#fbbf24]'>{note}</span> : null}
      </span>
      <span className={cn("text-sm font-bold tabular-nums", selected ? "text-[#e2e8f0]" : "text-[#475569]")}>
        {selected ? formatPeso(per) : "—"}
      </span>
    </button>
  );

  return (
    <div className='flex flex-col gap-[14px]'>
      <div className='flex flex-wrap items-baseline justify-between gap-[10px]'>
        <span className='text-[15px] font-bold'>Who&apos;s in on this?</span>
        <span className='font-mono text-xs text-[#fbbf24]'>
          {formatPeso(per)} each · {splitWith.length} {splitWith.length === 1 ? "person" : "people"}
        </span>
      </div>

      <div className='overflow-hidden rounded-[20px] border border-white/[.08] bg-[rgba(15,23,42,.6)]'>
        {members.map((member) => row(member, getDisplayName(member), splitWith.includes(member), () => toggleMember(member)))}
        {guests.map((guest) => row(guest, guest, true, () => toggleMember(guest), "Guest"))}
      </div>

      <button
        type='button'
        onClick={toggleSelectAll}
        className='w-fit cursor-pointer text-[13px] font-semibold text-[#fbbf24] hover:text-[#fcd34d]'
      >
        {splitWith.length === members.length ? "Deselect everyone" : "Select everyone"}
      </button>

      <div className='flex flex-col gap-[10px] border-t border-white/[.06] pt-4'>
        <span className='text-[13px] font-semibold text-[#cbd5e1]'>Add a guest</span>
        <div className='flex gap-2'>
          <input
            type='text'
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            placeholder="Someone who isn't on Wanderly"
            className={cn(INPUT, "flex-1")}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addGuest();
              }
            }}
          />
          <button
            type='button'
            aria-label='Add guest'
            onClick={addGuest}
            disabled={!guestName.trim()}
            className='flex size-[46px] flex-none cursor-pointer items-center justify-center rounded-xl bg-[#fbbf24] text-[#0b0a06] disabled:cursor-not-allowed disabled:opacity-[.45]'
          >
            <Plus className='size-5' />
          </button>
        </div>
        {guests.length > 0 ? (
          <div className='flex flex-wrap gap-2'>
            {guests.map((guest) => (
              <span key={guest} className='flex items-center gap-2 rounded-full border border-[rgba(251,191,36,.3)] bg-[rgba(251,191,36,.08)] py-1 pl-3 pr-1 text-[13px] text-[#fde68a]'>
                {guest}
                <button
                  type='button'
                  aria-label={`Remove ${guest}`}
                  onClick={() => toggleMember(guest)}
                  className='flex size-6 cursor-pointer items-center justify-center rounded-full text-[#fbbf24] hover:bg-white/[.08]'
                >
                  <Trash2 className='size-[13px]' />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {form.formState.errors.splitWith ? <p className={cn(FIELD_ERROR, "text-center")}>{form.formState.errors.splitWith.message}</p> : null}
    </div>
  );
};
