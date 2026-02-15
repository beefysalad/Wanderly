// Fallback configuration for "What's New" modal

export interface WhatsNewFeature {
  icon: string;
  title: string;
  description: string;
  color: string;
  bg: string;
}

export const CURRENT_WHATS_NEW_VERSION = "v2.1";

export const WHATS_NEW_FEATURES: WhatsNewFeature[] = [
  {
    icon: "Sparkles",
    title: "Fresh New Look",
    description:
      "I've completely overhauled the UI to be cleaner, darker, and more premium. Enjoy the new aesthetic while you plan your trips.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: "Smartphone",
    title: "Activities DnD",
    description:
      "I added a drag and drop feature for activities. You can now drag and drop activities to reorder them.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: "Beaker",
    title: "Beta Access",
    description:
      "You're one of the first to try out these new features. I'm still in beta, so your feedback is incredibly valuable to me!",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
];
