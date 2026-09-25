import { CheckCircle, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { UseFormReturn } from "react-hook-form";
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

export const SplitStep = ({
  form,
  members,
  getDisplayName,
  toggleMember,
  toggleSelectAll,
  guestName,
  setGuestName,
}: ISplitStepProps) => {
  return (
    <div className='space-y-4'>
      <div className='text-center mb-2 hidden sm:block'>
        <h3 className='text-lg font-bold text-white'>
          Split Cost
        </h3>
        <p className='text-sm text-slate-400'>
          Who are you splitting this with?
        </p>
      </div>

      <div className='flex items-center justify-between'>
        <label className='text-sm font-semibold text-slate-300'>
          Select Members
        </label>
        <button
          type='button'
          onClick={toggleSelectAll}
          className='text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors'
        >
          {form.watch("splitWith").length === members.length
            ? "Deselect All"
            : "Select All"}
        </button>
      </div>

      <div className='space-y-2 max-h-[400px] overflow-y-auto pr-2'>
        {members.map((member) => {
          const isSelected = form
            .watch("splitWith")
            .includes(member);
          return (
            <motion.div
              key={member}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleMember(member)}
              className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "bg-slate-800 border-orange-500/50 shadow-lg shadow-orange-500/5"
                  : "bg-slate-800/30 border-white/5 hover:bg-slate-800/50"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 transition-colors ${
                  isSelected
                    ? "bg-orange-500 border-orange-500"
                    : "border-slate-500"
                }`}
              >
                {isSelected && (
                  <CheckCircle className='w-3.5 h-3.5 text-white' />
                )}
              </div>
              <div className='flex-1'>
                <p
                  className={`font-medium text-sm ${isSelected ? "text-white" : "text-slate-400"}`}
                >
                  {getDisplayName(member)}
                </p>
                <p className='text-xs text-slate-500'>{member}</p>
              </div>
              {isSelected && (
                <span className='text-xs font-medium text-orange-400'>
                  Split
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Guests Section */}
      <div className='space-y-3 pt-2 border-t border-white/5'>
        <label className='text-sm font-semibold text-slate-300'>
          Add Guests
        </label>
        <div className='flex gap-2'>
          <input
            type='text'
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder='Enter guest name'
            className='flex-1 px-3 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all'
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (guestName.trim()) {
                  toggleMember(guestName.trim());
                  setGuestName("");
                }
              }
            }}
          />
          <button
            type='button'
            onClick={() => {
              if (guestName.trim()) {
                toggleMember(guestName.trim());
                setGuestName("");
              }
            }}
            disabled={!guestName.trim()}
            className='p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            <Plus className='w-5 h-5' />
          </button>
        </div>

        {/* Display Guests */}
        <div className='space-y-2'>
          {form
            .watch("splitWith")
            .filter((m) => !members.includes(m))
            .map((guest) => (
              <motion.div
                key={guest}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='flex items-center justify-between p-3 rounded-xl border border-orange-500/30 bg-orange-500/10'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-xs'>
                    {guest.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className='font-medium text-sm text-white'>
                      {guest}
                    </p>
                    <p className='text-[10px] text-orange-400'>
                      Guest
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => toggleMember(guest)}
                  className='p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </motion.div>
            ))}
        </div>
      </div>

      {form.formState.errors.splitWith && (
        <p className='text-sm text-red-400 text-center'>
          {form.formState.errors.splitWith.message}
        </p>
      )}
    </div>
  );
};
