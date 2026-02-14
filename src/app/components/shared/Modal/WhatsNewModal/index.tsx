import { X, Sparkles, Smartphone, Beaker } from "lucide-react";
import React from "react";

interface IWhatsNewModalProps {
  onClose: () => void;
}

const WhatsNewModal = ({ onClose }: IWhatsNewModalProps) => {
  const features = [
    {
      icon: Sparkles,
      title: "Fresh New Look",
      description:
        "I've completley overhauled the UI to be cleaner, darker, and more premium. Enjoy the new aesthetic while you plan your trips.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description:
        "Planning on the go? The app is now fully responsive and looks great on your phone, tablet, or desktop.",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: Beaker,
      title: "Beta Access",
      description:
        "You're one of the first to try out these new features. I'm still in beta, so your feedback is incredibly valuable to me!",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300'>
      <div className='bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden'>
        {/* Background Gradients */}
        <div className='absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none'></div>
        <div className='absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none'></div>

        {/* Header */}
        <div className='p-6 md:p-8 pt-10 pb-2 relative text-center'>
          <div className='inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 mb-6 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20 ring-offset-2 ring-offset-slate-900'>
            <Sparkles className='w-8 h-8 text-emerald-400' />
          </div>
          <h2 className='text-3xl font-bold text-white mb-2 tracking-tight'>
            What&apos;s New
          </h2>
          <p className='text-slate-400 max-w-sm mx-auto'>
            I&apos;ve been hard at work making things better. Here&apos;s what
            has changed in the latest update.
          </p>

          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 md:p-8 space-y-4'>
          {features.map((feature, index) => {
            const Icon = feature.icon;
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
        </div>

        {/* Footer */}
        <div className='p-6 md:p-8 pt-0'>
          <button
            onClick={onClose}
            className='w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0'
          >
            Awesome, let&apos;s go!
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsNewModal;
