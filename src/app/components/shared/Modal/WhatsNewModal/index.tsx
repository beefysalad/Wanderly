import {
  X,
  Sparkles,
  Smartphone,
  Beaker,
  Layout,
  MessageSquare,
  Globe,
  Calendar,
  Zap,
  Map,
  Heart,
  Target,
  Award,
  Coffee,
  Rocket,
  Gift,
  Bell,
  Shield,
  Activity,
  Camera,
  Music,
  Video,
  ShoppingBag,
  CreditCard,
  Wallet,
  Key,
  Lock,
  Unlock,
  Settings,
  Command,
  Terminal,
  Code,
  Cloud,
  Database,
  Server,
  HardDrive,
  Monitor,
  Image,
  Send,
  Share,
  Trophy,
  Flag,
  Anchor,
  Sun,
  Moon,
  CloudRain,
  Wind,
  Thermometer,
  Paperclip,
  Link,
  MapPin,
  User,
  Users,
  Flame,
  LucideIcon,
} from "lucide-react";
import React from "react";

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Smartphone,
  Beaker,
  Layout,
  MessageSquare,
  Globe,
  Calendar,
  Zap,
  Map,
  Heart,
  Target,
  Award,
  Coffee,
  Rocket,
  Gift,
  Bell,
  Shield,
  Activity,
  Camera,
  Music,
  Video,
  ShoppingBag,
  CreditCard,
  Wallet,
  Key,
  Lock,
  Unlock,
  Settings,
  Command,
  Terminal,
  Code,
  Cloud,
  Database,
  Server,
  HardDrive,
  Monitor,
  Image,
  Send,
  Share,
  Trophy,
  Flag,
  Anchor,
  Sun,
  Moon,
  CloudRain,
  Wind,
  Thermometer,
  Paperclip,
  Link,
  MapPin,
  User,
  Users,
  Flame,
};

export interface WhatsNewFeature {
  icon: string;
  title: string;
  description: string;
  color: string;
  bg: string;
}

interface IWhatsNewModalProps {
  onClose: () => void;
  features: WhatsNewFeature[];
}

const WhatsNewModal = ({ onClose, features }: IWhatsNewModalProps) => {
  const releasedOn = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className='fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-300'>
      <div className='relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl'>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(56,189,248,0.12),transparent_35%)]' />

        <button
          onClick={onClose}
          className='absolute right-5 top-5 z-50 rounded-full border border-white/10 bg-slate-900/90 p-2 text-slate-400 transition-colors hover:text-white'
        >
          <X className='w-5 h-5' />
        </button>

        <div className='relative border-b border-white/10 bg-slate-900/70 px-6 pb-5 pt-8 md:px-8'>
          <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-emerald-300'>
            <Sparkles className='h-3.5 w-3.5' />
            Release Notes
          </div>
          <h2 className='text-3xl font-semibold text-white md:text-4xl'>
            What&apos;s New
          </h2>
          <p className='mt-2 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base'>
            Fresh improvements are live. Here are the latest upgrades designed
            to make your planning flow faster and cleaner.
          </p>
          <p className='mt-3 text-xs uppercase tracking-wide text-slate-500'>
            Updated {releasedOn}
          </p>
        </div>

        <div className='relative flex-1 overflow-y-auto px-6 py-6 md:px-8'>
          <div className='space-y-3'>
            {features.map((feature, index) => {
              const Icon = ICON_MAP[feature.icon] || Sparkles;
              return (
                <article
                  key={index}
                  className='group rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition-colors hover:bg-slate-900'
                >
                  <div className='flex items-start gap-4'>
                    <div
                      className={`mt-0.5 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${feature.bg} ring-1 ring-white/10`}
                    >
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='mb-1 flex items-start justify-between gap-3'>
                        <h3 className='text-base font-semibold text-white md:text-lg'>
                          {feature.title}
                        </h3>
                        <span className='rounded-md border border-white/10 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400'>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <p className='text-sm leading-relaxed text-slate-300'>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className='relative border-t border-white/10 bg-slate-900/80 px-6 py-4 md:px-8'>
          <button
            onClick={onClose}
            className='w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200 md:text-base'
          >
            Continue
          </button>
          <p className='mt-2 text-center text-xs text-slate-500'>
            Thanks for building with Wanderly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsNewModal;
