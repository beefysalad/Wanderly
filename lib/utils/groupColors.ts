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

export interface GroupColorClasses {
  // Backgrounds
  bg: string;
  bgLight: string;
  bgLighter: string;
  // Text
  text: string;
  textDark: string;
  // Borders
  border: string;
  borderLight: string;
  // Hover states
  hoverBorder: string;
  hoverBg: string;
  hoverText: string;
  hoverBgLight: string;
  // Gradients
  gradient: string;
  gradientHover: string;
  // Icon colors
  icon: string;
}

export function getGroupColorClasses(colorScheme?: string): GroupColorClasses {
  const scheme = (colorScheme || "orange") as ColorScheme;

  const colorMap: Record<ColorScheme, GroupColorClasses> = {
    orange: {
      bg: "bg-orange-500",
      bgLight: "bg-orange-50",
      bgLighter: "bg-orange-100",
      text: "text-orange-600",
      textDark: "text-orange-700",
      border: "border-orange-500",
      borderLight: "border-orange-200",
      hoverBorder: "hover:border-orange-400",
      hoverBg: "hover:bg-orange-600",
      hoverText: "hover:text-orange-600",
      hoverBgLight: "hover:bg-orange-50",
      gradient: "from-orange-500 to-orange-500",
      gradientHover: "hover:from-orange-600 hover:to-orange-600",
      icon: "text-orange-500",
    },
    blue: {
      bg: "bg-blue-500",
      bgLight: "bg-blue-50",
      bgLighter: "bg-blue-100",
      text: "text-blue-600",
      textDark: "text-blue-700",
      border: "border-blue-500",
      borderLight: "border-blue-200",
      hoverBorder: "hover:border-blue-400",
      hoverBg: "hover:bg-blue-600",
      hoverText: "hover:text-blue-600",
      hoverBgLight: "hover:bg-blue-50",
      gradient: "from-blue-500 to-blue-500",
      gradientHover: "hover:from-blue-600 hover:to-blue-600",
      icon: "text-blue-500",
    },
    green: {
      bg: "bg-green-500",
      bgLight: "bg-green-50",
      bgLighter: "bg-green-100",
      text: "text-green-600",
      textDark: "text-green-700",
      border: "border-green-500",
      borderLight: "border-green-200",
      hoverBorder: "hover:border-green-400",
      hoverBg: "hover:bg-green-600",
      hoverText: "hover:text-green-600",
      hoverBgLight: "hover:bg-green-50",
      gradient: "from-green-500 to-green-500",
      gradientHover: "hover:from-green-600 hover:to-green-600",
      icon: "text-green-500",
    },
    purple: {
      bg: "bg-purple-500",
      bgLight: "bg-purple-50",
      bgLighter: "bg-purple-100",
      text: "text-purple-600",
      textDark: "text-purple-700",
      border: "border-purple-500",
      borderLight: "border-purple-200",
      hoverBorder: "hover:border-purple-400",
      hoverBg: "hover:bg-purple-600",
      hoverText: "hover:text-purple-600",
      hoverBgLight: "hover:bg-purple-50",
      gradient: "from-purple-500 to-purple-500",
      gradientHover: "hover:from-purple-600 hover:to-purple-600",
      icon: "text-purple-500",
    },
    pink: {
      bg: "bg-pink-500",
      bgLight: "bg-pink-50",
      bgLighter: "bg-pink-100",
      text: "text-pink-600",
      textDark: "text-pink-700",
      border: "border-pink-500",
      borderLight: "border-pink-200",
      hoverBorder: "hover:border-pink-400",
      hoverBg: "hover:bg-pink-600",
      hoverText: "hover:text-pink-600",
      hoverBgLight: "hover:bg-pink-50",
      gradient: "from-pink-500 to-pink-500",
      gradientHover: "hover:from-pink-600 hover:to-pink-600",
      icon: "text-pink-500",
    },
    red: {
      bg: "bg-red-500",
      bgLight: "bg-red-50",
      bgLighter: "bg-red-100",
      text: "text-red-600",
      textDark: "text-red-700",
      border: "border-red-500",
      borderLight: "border-red-200",
      hoverBorder: "hover:border-red-400",
      hoverBg: "hover:bg-red-600",
      hoverText: "hover:text-red-600",
      hoverBgLight: "hover:bg-red-50",
      gradient: "from-red-500 to-red-500",
      gradientHover: "hover:from-red-600 hover:to-red-600",
      icon: "text-red-500",
    },
    amber: {
      bg: "bg-amber-500",
      bgLight: "bg-amber-50",
      bgLighter: "bg-amber-100",
      text: "text-amber-600",
      textDark: "text-amber-700",
      border: "border-amber-500",
      borderLight: "border-amber-200",
      hoverBorder: "hover:border-amber-400",
      hoverBg: "hover:bg-amber-600",
      hoverText: "hover:text-amber-600",
      hoverBgLight: "hover:bg-amber-50",
      gradient: "from-amber-500 to-amber-500",
      gradientHover: "hover:from-amber-600 hover:to-amber-600",
      icon: "text-amber-500",
    },
    emerald: {
      bg: "bg-emerald-500",
      bgLight: "bg-emerald-50",
      bgLighter: "bg-emerald-100",
      text: "text-emerald-600",
      textDark: "text-emerald-700",
      border: "border-emerald-500",
      borderLight: "border-emerald-200",
      hoverBorder: "hover:border-emerald-400",
      hoverBg: "hover:bg-emerald-600",
      hoverText: "hover:text-emerald-600",
      hoverBgLight: "hover:bg-emerald-50",
      gradient: "from-emerald-500 to-emerald-500",
      gradientHover: "hover:from-emerald-600 hover:to-emerald-600",
      icon: "text-emerald-500",
    },
    indigo: {
      bg: "bg-indigo-500",
      bgLight: "bg-indigo-50",
      bgLighter: "bg-indigo-100",
      text: "text-indigo-600",
      textDark: "text-indigo-700",
      border: "border-indigo-500",
      borderLight: "border-indigo-200",
      hoverBorder: "hover:border-indigo-400",
      hoverBg: "hover:bg-indigo-600",
      hoverText: "hover:text-indigo-600",
      hoverBgLight: "hover:bg-indigo-50",
      gradient: "from-indigo-500 to-indigo-500",
      gradientHover: "hover:from-indigo-600 hover:to-indigo-600",
      icon: "text-indigo-500",
    },
    cyan: {
      bg: "bg-cyan-500",
      bgLight: "bg-cyan-50",
      bgLighter: "bg-cyan-100",
      text: "text-cyan-600",
      textDark: "text-cyan-700",
      border: "border-cyan-500",
      borderLight: "border-cyan-200",
      hoverBorder: "hover:border-cyan-400",
      hoverBg: "hover:bg-cyan-600",
      hoverText: "hover:text-cyan-600",
      hoverBgLight: "hover:bg-cyan-50",
      gradient: "from-cyan-500 to-cyan-500",
      gradientHover: "hover:from-cyan-600 hover:to-cyan-600",
      icon: "text-cyan-500",
    },
  };

  return colorMap[scheme] || colorMap.orange;
}

