"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Smartphone,
  Beaker,
  Save,
  Plus,
  Trash2,
  ArrowLeft,
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
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

interface WhatsNewFeature {
  icon: string;
  title: string;
  description: string;
  color: string;
  bg: string;
}

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

const COLOR_PRESETS = [
  {
    name: "Amber",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    name: "Blue",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    name: "Rose",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  {
    name: "Emerald",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    name: "Purple",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    name: "Sky",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  {
    name: "Indigo",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
  {
    name: "Teal",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
  },
  {
    name: "Orange",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    name: "Pink",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
  },
  {
    name: "Lime",
    color: "text-lime-400",
    bg: "bg-lime-500/10",
    border: "border-lime-500/20",
  },
  {
    name: "Cyan",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    name: "Fuchsia",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/20",
  },
];

const AdminWhatsNew = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState("");
  const [features, setFeatures] = useState<WhatsNewFeature[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get("/config/whats-new");
      setVersion(res.data.version);
      setFeatures(res.data.features);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load configuration. Make sure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const password = sessionStorage.getItem("admin_password");
    if (!password) {
      alert("No admin password found. Please log in again.");
      return;
    }

    setSaving(true);
    try {
      await fetch("/api/config/whats-new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ version, features }),
      });
      alert("Configuration saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    setFeatures([
      ...features,
      {
        icon: "Sparkles",
        title: "New Feature",
        description: "Description of the new feature.",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
      },
    ]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFeatures(newFeatures);
  };

  const setFeatureColors = (
    index: number,
    preset: (typeof COLOR_PRESETS)[0],
  ) => {
    const newFeatures = [...features];
    newFeatures[index] = {
      ...newFeatures[index],
      color: preset.color,
      bg: preset.bg,
    };
    setFeatures(newFeatures);
  };

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
        {/* Header */}
        <div className='flex items-center justify-between mb-12'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => router.push("/admin")}
              className='p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-white tracking-tight'>
                Announcements
              </h1>
              <p className='text-slate-400'>
                Manage the &quot;What&apos;s New&quot; modal
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className='px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2'
          >
            {saving ? (
              <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
            ) : (
              <Save className='w-5 h-5' />
            )}
            Save Changes
          </button>
        </div>

        {error && (
          <div className='bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl mb-8 text-rose-500 text-sm'>
            {error}
          </div>
        )}

        <div className='grid lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2 space-y-8'>
            {/* Version Section */}
            <section className='bg-slate-900/50 border border-white/10 rounded-3xl p-8 overflow-hidden relative'>
              <div className='absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2'></div>
              <h2 className='text-xl font-semibold text-white mb-6 flex items-center gap-2'>
                <Sparkles className='w-5 h-5 text-amber-400' />
                App Version
              </h2>
              <div className='max-w-xs'>
                <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>
                  Current Modal Version
                </label>
                <input
                  type='text'
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder='e.g. v2.1'
                  className='w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50'
                />
              </div>
            </section>

            {/* Features Section */}
            <section className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold text-white flex items-center gap-2'>
                  <Layout className='w-5 h-5 text-blue-400' />
                  Features List
                </h2>
                <button
                  onClick={addFeature}
                  className='px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors flex items-center gap-2'
                >
                  <Plus className='w-4 h-4' />
                  Add Feature
                </button>
              </div>

              <div className='space-y-6'>
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className='bg-slate-900/50 border border-white/10 rounded-3xl p-8 relative group hover:border-white/20 transition-colors'
                  >
                    <button
                      onClick={() => removeFeature(index)}
                      className='absolute top-6 right-6 p-2 text-slate-500 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100'
                    >
                      <Trash2 className='w-5 h-5' />
                    </button>

                    <div className='grid gap-8'>
                      <div className='grid md:grid-cols-2 gap-6'>
                        <div className='space-y-4'>
                          <div>
                            <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>
                              Title
                            </label>
                            <input
                              type='text'
                              value={feature.title}
                              onChange={(e) =>
                                updateFeature(index, "title", e.target.value)
                              }
                              className='w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50'
                            />
                          </div>
                          <div>
                            <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>
                              Description
                            </label>
                            <textarea
                              value={feature.description}
                              onChange={(e) =>
                                updateFeature(
                                  index,
                                  "description",
                                  e.target.value,
                                )
                              }
                              rows={3}
                              className='w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none'
                            />
                          </div>
                        </div>

                        <div className='space-y-6'>
                          {/* Visual Icon Picker */}
                          <div>
                            <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3'>
                              Icon
                            </label>
                            <div className='flex flex-wrap gap-2'>
                              {Object.keys(ICON_MAP).map((iconName) => {
                                const Icon = ICON_MAP[iconName];
                                return (
                                  <button
                                    key={iconName}
                                    onClick={() =>
                                      updateFeature(index, "icon", iconName)
                                    }
                                    className={`p-3 rounded-xl border transition-all ${
                                      feature.icon === iconName
                                        ? "bg-purple-500/20 border-purple-500 text-purple-400"
                                        : "bg-slate-800/50 border-white/10 text-slate-400 hover:border-white/30"
                                    }`}
                                  >
                                    <Icon className='w-5 h-5' />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Visual Color Picker */}
                          <div>
                            <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3'>
                              Color Preset
                            </label>
                            <div className='flex flex-wrap gap-3'>
                              {COLOR_PRESETS.map((preset) => (
                                <button
                                  key={preset.name}
                                  onClick={() =>
                                    setFeatureColors(index, preset)
                                  }
                                  className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                                    feature.color === preset.color
                                      ? "border-white scale-110 shadow-lg shadow-white/20"
                                      : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                                  }`}
                                  style={{
                                    backgroundColor: preset.bg
                                      .split("bg-")[1]
                                      .split("/")[0],
                                  }}
                                >
                                  <div
                                    className={`w-3 h-3 rounded-full ${preset.bg.replace("/10", "")}`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar - Live Preview */}
          <div className='lg:col-span-1'>
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
                    <span className='text-sm font-bold text-white'>
                      Wanderly {version || "v?"}
                    </span>
                  </div>

                  <div className='space-y-4'>
                    {features.length === 0 ? (
                      <div className='text-center py-8 border-2 border-dashed border-white/5 rounded-xl'>
                        <p className='text-xs text-slate-600'>
                          No features added yet
                        </p>
                      </div>
                    ) : (
                      features.map((f, i) => {
                        const Icon = ICON_MAP[f.icon] || Sparkles;
                        return (
                          <div
                            key={i}
                            className='flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5'
                          >
                            <div
                              className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center flex-shrink-0`}
                            >
                              <Icon className={`w-5 h-5 ${f.color}`} />
                            </div>
                            <div className='min-w-0'>
                              <h4 className='text-xs font-bold text-white truncate'>
                                {f.title || "Untitled"}
                              </h4>
                              <p className='text-[10px] text-slate-400 leading-normal line-clamp-2 mt-0.5'>
                                {f.description || "No description provided."}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button className='w-full py-3 bg-white text-slate-950 font-bold text-xs rounded-xl mt-4'>
                    Let&apos;s explore!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminWhatsNew;
