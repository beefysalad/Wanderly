export type ColorScheme =
  | "orange"
  | "blue"
  | "green"
  | "purple"
  | "pink"
  | "red"
  | "amber"
  | "emerald"
  | "indigo"
  | "cyan";

export interface VibeInfo {
  name: string;
  emoji: string;
  description: string;
  colorScheme: ColorScheme;
}

export const VIBES: Record<ColorScheme, VibeInfo> = {
  orange: {
    name: "Adventure",
    emoji: "🎒",
    description: "For the thrill-seekers and explorers.",
    colorScheme: "orange",
  },
  blue: {
    name: "Seaside",
    emoji: "🏖️",
    description: "Beach trips and ocean breezes.",
    colorScheme: "blue",
  },
  green: {
    name: "Forest",
    emoji: "🏔️",
    description: "Nature, hiking, and fresh air.",
    colorScheme: "green",
  },
  purple: {
    name: "Night City",
    emoji: "🎡",
    description: "Urban exploration and nightlife.",
    colorScheme: "purple",
  },
  pink: {
    name: "Global Explorer",
    emoji: "🌐",
    description: "International adventures and world tours.",
    colorScheme: "pink",
  },
  red: {
    name: "Passion",
    emoji: "🔥",
    description: "High energy and unforgettable moments.",
    colorScheme: "red",
  },
  amber: {
    name: "Road Trip",
    emoji: "🚗",
    description: "Long drives and scenic routes.",
    colorScheme: "amber",
  },
  emerald: {
    name: "Hidden Gems",
    emoji: "💎",
    description: "Finding the off-beat path.",
    colorScheme: "emerald",
  },
  indigo: {
    name: "Culture",
    emoji: "🏛️",
    description: "Museums, history, and food.",
    colorScheme: "indigo",
  },
  cyan: {
    name: "Island Life",
    emoji: "🌴",
    description: "Tropical getaways and palm trees.",
    colorScheme: "cyan",
  },
};

export function getVibeInfo(colorScheme?: string): VibeInfo {
  const scheme = (colorScheme || "orange") as ColorScheme;
  return VIBES[scheme] || VIBES.orange;
}
