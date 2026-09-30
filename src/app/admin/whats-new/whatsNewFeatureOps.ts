import type { WhatsNewFeature } from "@/src/app/config/whats-new";
import type { ColorPreset } from "./colorPresets";

/** Appends a blank starter feature for the admin to fill in. */
export function addFeature(features: WhatsNewFeature[]): WhatsNewFeature[] {
  return [...features, { icon: "Sparkles", title: "New Feature", description: "Description of the new feature.", color: "text-amber-400", bg: "bg-amber-500/10" }];
}

/** Removes the feature at `index`. */
export function removeFeature(features: WhatsNewFeature[], index: number): WhatsNewFeature[] {
  return features.filter((_, i) => i !== index);
}

/** Sets a single field on the feature at `index`. */
export function updateFeature(features: WhatsNewFeature[], index: number, field: keyof WhatsNewFeature, value: string): WhatsNewFeature[] {
  return features.map((feature, i) => (i === index ? { ...feature, [field]: value } : feature));
}

/** Applies a color preset's `color`/`bg` to the feature at `index`. */
export function setFeatureColors(features: WhatsNewFeature[], index: number, preset: ColorPreset): WhatsNewFeature[] {
  return features.map((feature, i) => (i === index ? { ...feature, color: preset.color, bg: preset.bg } : feature));
}
