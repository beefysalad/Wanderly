import { Calendar, Check, MapPin, Receipt, UserPlus, Wallet, type LucideIcon } from "lucide-react";
import type { NotificationKind } from "./notificationMeta";

// Literal class strings so Tailwind can generate them.
export const KIND_STYLE: Record<NotificationKind, { icon: LucideIcon; tile: string }> = {
  pay: { icon: Wallet, tile: "bg-[#fbbf24]/[.12] text-[#fbbf24]" },
  ok: { icon: Check, tile: "bg-[#34d399]/[.12] text-[#34d399]" },
  exp: { icon: Receipt, tile: "bg-[#fb923c]/[.12] text-[#fb923c]" },
  join: { icon: UserPlus, tile: "bg-[#38bdf8]/[.12] text-[#38bdf8]" },
  act: { icon: Calendar, tile: "bg-[#a78bfa]/[.12] text-[#a78bfa]" },
  trip: { icon: MapPin, tile: "bg-[#fbbf24]/[.12] text-[#fbbf24]" },
};
