import { Smartphone, Sparkles } from "lucide-react";
import { WHATS_NEW_ICON_MAP, type WhatsNewFeature } from "@/src/app/config/whats-new";

interface IWhatsNewPreviewProps {
  version: string;
  features: WhatsNewFeature[];
}

/** A live preview of how the current draft will look in the actual "what's new" modal. */
export const WhatsNewPreview = ({ version, features }: IWhatsNewPreviewProps) => {
  return (
    <div className='sticky top-8 space-y-6'>
      <div className='bg-slate-900/50 border border-white/10 rounded-3xl p-6'>
        <h3 className='text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2'>
          <Smartphone className='w-4 h-4' />
          Live Preview
        </h3>

        <div className='bg-slate-950 rounded-2xl p-6 border border-white/5 shadow-2xl space-y-4'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center'>
              <Sparkles className='w-4 h-4 text-amber-500' />
            </div>
            <span className='text-sm font-bold text-white'>Wanderly {version || "v?"}</span>
          </div>

          <div className='space-y-4'>
            {features.length === 0 ? (
              <div className='text-center py-8 border-2 border-dashed border-white/5 rounded-xl'>
                <p className='text-xs text-slate-600'>No features added yet</p>
              </div>
            ) : (
              features.map((f, i) => {
                const Icon = WHATS_NEW_ICON_MAP[f.icon] || Sparkles;
                return (
                  <div key={i} className='flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5'>
                    <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <div className='min-w-0'>
                      <h4 className='text-xs font-bold text-white truncate'>{f.title || "Untitled"}</h4>
                      <p className='text-[10px] text-slate-400 leading-normal line-clamp-2 mt-0.5'>{f.description || "No description provided."}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button className='w-full py-3 bg-white text-slate-950 font-bold text-xs rounded-xl mt-4'>Let&apos;s explore!</button>
        </div>
      </div>
    </div>
  );
};
