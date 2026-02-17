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
  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300'>
      <div className='bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]'>
        {/* Background Effects */}
        <div className='absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none'></div>
        <div className='absolute bottom-0 left-0 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none'></div>

        <button
          onClick={onClose}
          className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors z-50'
        >
          <X className='w-5 h-5' />
        </button>

        <div className='flex flex-col overflow-y-auto custom-scrollbar h-full'>
          {/* Header */}
          <div className='p-5 md:p-8 pt-8 md:pt-10 pb-2 relative text-center'>
            <h2 className='text-3xl font-bold text-white mb-2 tracking-tight'>
              What&apos;s New
            </h2>
            <p className='text-slate-400 max-w-sm mx-auto'>
              I&apos;ve been working hard on making things better. Here&apos;s
              what has changed in the latest update.
            </p>
          </div>

          {/* Content */}
          <div className='p-5 md:p-8 space-y-4'>
            {features.map((feature, index) => {
              const Icon = ICON_MAP[feature.icon] || Sparkles;
              return (
                <div
                  key={index}
                  className='flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group'
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className='font-semibold text-white mb-1'>
                      {feature.title}
                    </h3>
                    <p className='text-sm text-slate-400 leading-relaxed'>
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}

            <button
              onClick={onClose}
              className='w-full py-3.5 px-4 mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0'
            >
              Awesome, let&apos;s go!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsNewModal;
