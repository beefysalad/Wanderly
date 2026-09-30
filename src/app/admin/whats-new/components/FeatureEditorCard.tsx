import { Trash2 } from "lucide-react";
import { WHATS_NEW_ICON_MAP, type WhatsNewFeature } from "@/src/app/config/whats-new";
import { COLOR_PRESETS, type ColorPreset } from "../colorPresets";

interface IFeatureEditorCardProps {
  feature: WhatsNewFeature;
  onChange: (field: keyof WhatsNewFeature, value: string) => void;
  onSetColors: (preset: ColorPreset) => void;
  onRemove: () => void;
}

/** One editable feature card: title, description, icon picker and color picker. */
export const FeatureEditorCard = ({ feature, onChange, onSetColors, onRemove }: IFeatureEditorCardProps) => {
  return (
    <div className='bg-slate-900/50 border border-white/10 rounded-3xl p-8 relative group hover:border-white/20 transition-colors'>
      <button onClick={onRemove} className='absolute top-6 right-6 p-2 text-slate-500 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100'>
        <Trash2 className='w-5 h-5' />
      </button>

      <div className='grid gap-8'>
        <div className='grid md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div>
              <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Title</label>
              <input
                type='text'
                value={feature.title}
                onChange={(e) => onChange("title", e.target.value)}
                className='w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50'
              />
            </div>
            <div>
              <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Description</label>
              <textarea
                value={feature.description}
                onChange={(e) => onChange("description", e.target.value)}
                rows={3}
                className='w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none'
              />
            </div>
          </div>

          <div className='space-y-6'>
            <div>
              <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3'>Icon</label>
              <div className='flex flex-wrap gap-2'>
                {Object.keys(WHATS_NEW_ICON_MAP).map((iconName) => {
                  const Icon = WHATS_NEW_ICON_MAP[iconName];
                  return (
                    <button
                      key={iconName}
                      onClick={() => onChange("icon", iconName)}
                      className={`p-3 rounded-xl border transition-all ${
                        feature.icon === iconName ? "bg-purple-500/20 border-purple-500 text-purple-400" : "bg-slate-800/50 border-white/10 text-slate-400 hover:border-white/30"
                      }`}
                    >
                      <Icon className='w-5 h-5' />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3'>Color Preset</label>
              <div className='flex flex-wrap gap-3'>
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => onSetColors(preset)}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                      feature.color === preset.color ? "border-white scale-110 shadow-lg shadow-white/20" : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{ backgroundColor: preset.bg.split("bg-")[1].split("/")[0] }}
                  >
                    <div className={`w-3 h-3 rounded-full ${preset.bg.replace("/10", "")}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
