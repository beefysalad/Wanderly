import { Bell, Briefcase, CreditCard, Layers, Map, MessageSquare, Target, Users, type LucideIcon } from "lucide-react";
import type { DBStats } from "../useDbStats";

interface IStatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: { bg: string; text: string };
}

const StatCard = ({ icon: Icon, label, value, color }: IStatCardProps) => (
  <div className='bg-slate-900/50 border border-white/10 rounded-2xl p-6'>
    <div className='flex items-center gap-4 mb-2'>
      <div className={`p-2 rounded-lg ${color.bg}`}>
        <Icon className={`w-5 h-5 ${color.text}`} />
      </div>
      <span className='text-xs font-bold text-slate-500 uppercase tracking-wider'>{label}</span>
    </div>
    <div className='text-3xl font-bold text-white'>{value.toLocaleString()}</div>
  </div>
);

const ENTITIES: { key: keyof DBStats; icon: LucideIcon; label: string; color: { bg: string; text: string } }[] = [
  { key: "users", icon: Users, label: "Users", color: { bg: "bg-blue-500/10", text: "text-blue-400" } },
  { key: "groups", icon: Briefcase, label: "Groups", color: { bg: "bg-orange-500/10", text: "text-orange-400" } },
  { key: "trips", icon: Map, label: "Trips", color: { bg: "bg-emerald-500/10", text: "text-emerald-400" } },
  { key: "activities", icon: Layers, label: "Activities", color: { bg: "bg-purple-500/10", text: "text-purple-400" } },
  { key: "expenses", icon: CreditCard, label: "Expenses", color: { bg: "bg-rose-500/10", text: "text-rose-400" } },
  { key: "budgets", icon: Target, label: "Budgets", color: { bg: "bg-amber-500/10", text: "text-amber-400" } },
  { key: "notifications", icon: Bell, label: "Notifications", color: { bg: "bg-indigo-500/10", text: "text-indigo-400" } },
  { key: "reviews", icon: MessageSquare, label: "Reviews", color: { bg: "bg-cyan-500/10", text: "text-cyan-400" } },
];

interface IEntityStatsGridProps {
  stats: DBStats;
}

/** The row of per-entity row counts (users, groups, trips, ...). */
export const EntityStatsGrid = ({ stats }: IEntityStatsGridProps) => (
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
    {ENTITIES.map(({ key, icon, label, color }) => (
      <StatCard key={key} icon={icon} label={label} value={stats[key]} color={color} />
    ))}
  </div>
);
