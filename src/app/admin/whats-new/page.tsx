"use client";

import { ArrowLeft, Layout, Plus, Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { FeatureEditorCard } from "./components/FeatureEditorCard";
import { WhatsNewPreview } from "./components/WhatsNewPreview";
import { useWhatsNewConfig } from "./useWhatsNewConfig";

const AdminWhatsNew = () => {
  const router = useRouter();
  const { loading, saving, version, setVersion, features, error, handleSave, addFeature, removeFeature, updateFeature, setFeatureColors } = useWhatsNewConfig();

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin' />
      </div>
    );
  }

  return (
    <main className='min-h-screen bg-slate-950 text-slate-200'>
      <div className='max-w-5xl mx-auto px-6 py-12'>
        <div className='flex items-center justify-between mb-12'>
          <div className='flex items-center gap-4'>
            <button onClick={() => router.push("/admin")} className='p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors'>
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-white tracking-tight'>Announcements</h1>
              <p className='text-slate-400'>Manage the &quot;What&apos;s New&quot; modal</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className='px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2'
          >
            {saving ? <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' /> : <Save className='w-5 h-5' />}
            Save Changes
          </button>
        </div>

        {error ? <div className='bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl mb-8 text-rose-500 text-sm'>{error}</div> : null}

        <div className='grid lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2 space-y-8'>
            <section className='bg-slate-900/50 border border-white/10 rounded-3xl p-8 overflow-hidden relative'>
              <div className='absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2'></div>
              <h2 className='text-xl font-semibold text-white mb-6 flex items-center gap-2'>
                <Sparkles className='w-5 h-5 text-amber-400' />
                App Version
              </h2>
              <div className='max-w-xs'>
                <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Current Modal Version</label>
                <input
                  type='text'
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder='e.g. v2.1'
                  className='w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50'
                />
              </div>
            </section>

            <section className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold text-white flex items-center gap-2'>
                  <Layout className='w-5 h-5 text-blue-400' />
                  Features List
                </h2>
                <button onClick={addFeature} className='px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors flex items-center gap-2'>
                  <Plus className='w-4 h-4' />
                  Add Feature
                </button>
              </div>

              <div className='space-y-6'>
                {features.map((feature, index) => (
                  <FeatureEditorCard
                    key={index}
                    feature={feature}
                    onChange={(field, value) => updateFeature(index, field, value)}
                    onSetColors={(preset) => setFeatureColors(index, preset)}
                    onRemove={() => removeFeature(index)}
                  />
                ))}
              </div>
            </section>
          </div>

          <div className='lg:col-span-1'>
            <WhatsNewPreview version={version} features={features} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminWhatsNew;
