import { useRef } from "react";
import { format } from "date-fns";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { getConfigIcon, type ConfigItem } from "../configHelpers";

interface IConfigListProps {
  configs: ConfigItem[];
  savingKey: string | null;
  onUpdate: (key: string, value: unknown) => void;
}

/** Every other `AppConfig` row (i.e. not maintenance-mode): a raw-JSON editor per key, plus a quick-add form. */
export const ConfigList = ({ configs, savingKey, onUpdate }: IConfigListProps) => {
  const others = configs.filter((c) => c.key !== "maintenance-mode");
  const newKeyRef = useRef<HTMLInputElement>(null);

  const addConfig = () => {
    const key = newKeyRef.current?.value;
    if (!key) {
      toast.error("Key is required");
      return;
    }
    onUpdate(key, {});
    if (newKeyRef.current) newKeyRef.current.value = "";
  };

  return (
    <>
      <div className='space-y-4'>
        <h2 className='text-xl font-bold text-white px-2'>Global Settings</h2>
        {others.map((config) => (
          <ConfigRow key={config.key} config={config} isSaving={savingKey === config.key} onSave={(value) => onUpdate(config.key, value)} />
        ))}

        {others.length === 0 ? <div className='text-center py-12 border border-dashed border-white/10 rounded-2xl text-slate-500'>No other configurations found.</div> : null}
      </div>

      <div className='bg-white/5 border border-dashed border-white/10 rounded-2xl p-6'>
        <h4 className='text-sm font-bold text-white mb-4'>Add New Setting</h4>
        <div className='flex gap-4'>
          <input
            ref={newKeyRef}
            type='text'
            placeholder='Key (e.g. site-banner)'
            className='flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50'
          />
          <button onClick={addConfig} className='px-6 py-2 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-all border border-white/10'>
            Create
          </button>
        </div>
      </div>
    </>
  );
};

interface IConfigRowProps {
  config: ConfigItem;
  isSaving: boolean;
  onSave: (value: unknown) => void;
}

const ConfigRow = ({ config, isSaving, onSave }: IConfigRowProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const Icon = getConfigIcon(config.key);

  const save = () => {
    const raw = textareaRef.current?.value ?? "";
    try {
      onSave(JSON.parse(raw));
    } catch {
      toast.error("Invalid JSON format");
    }
  };

  return (
    <div className='bg-slate-900/50 border border-white/10 rounded-2xl p-6 group'>
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-center gap-4'>
          <div className='p-2 bg-blue-500/10 rounded-lg'>
            <Icon className='w-5 h-5 text-blue-400' />
          </div>
          <div>
            <h4 className='font-bold text-white uppercase tracking-wider text-sm'>{config.key}</h4>
            <p className='text-xs text-slate-500'>Last updated: {format(new Date(config.updatedAt), "MMM d, HH:mm")}</p>
          </div>
        </div>
      </div>

      <div className='space-y-4'>
        <textarea
          ref={textareaRef}
          className='w-full bg-slate-950/50 border border-white/5 rounded-xl p-4 text-sm font-mono text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[120px]'
          defaultValue={JSON.stringify(config.value, null, 2)}
        />
        <div className='flex justify-end'>
          <button
            onClick={save}
            disabled={isSaving}
            className='flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-sm font-bold disabled:opacity-50'
          >
            <Save className='w-4 h-4' />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
