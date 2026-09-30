import { Car, Hotel, Plane, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import type { ActivityType } from "../useActivityForm";

const TYPES: { type: ActivityType; label: string; icon: typeof Ticket; hoverBorder: string; hoverText: string; hoverBg: string }[] = [
  { type: "general", label: "General", icon: Ticket, hoverBorder: "hover:border-orange-500/50", hoverText: "group-hover:text-orange-400", hoverBg: "group-hover:bg-orange-500/10" },
  { type: "flight", label: "Flight", icon: Plane, hoverBorder: "hover:border-blue-500/50", hoverText: "group-hover:text-blue-400", hoverBg: "group-hover:bg-blue-500/10" },
  { type: "transport", label: "Transport", icon: Car, hoverBorder: "hover:border-purple-500/50", hoverText: "group-hover:text-purple-400", hoverBg: "group-hover:bg-purple-500/10" },
  { type: "accommodation", label: "Hotel / Stay", icon: Hotel, hoverBorder: "hover:border-emerald-500/50", hoverText: "group-hover:text-emerald-400", hoverBg: "group-hover:bg-emerald-500/10" },
];

interface ITypePickerProps {
  onSelect: (type: ActivityType) => void;
}

/** Step 1 of adding an activity: pick a category, which pre-fills the fields below it makes sense for. */
export const TypePicker = ({ onSelect }: ITypePickerProps) => {
  return (
    <motion.div
      key='step1'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className='space-y-6'
    >
      <div className='text-center mb-8'>
        <h2 className='text-2xl font-bold text-white mb-2'>What kind of activity?</h2>
        <p className='text-slate-400'>Choose a category to get started.</p>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        {TYPES.map(({ type, label, icon: Icon, hoverBorder, hoverText, hoverBg }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`bg-slate-800/30 backdrop-blur-md border border-white/5 ${hoverBorder} hover:bg-slate-800/50 p-6 rounded-2xl flex flex-col items-center gap-4 transition-all group`}
          >
            <div className={`w-14 h-14 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 ${hoverText} ${hoverBg} transition-colors border border-white/5`}>
              <Icon className='w-7 h-7' />
            </div>
            <span className='font-semibold text-white'>{label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};
