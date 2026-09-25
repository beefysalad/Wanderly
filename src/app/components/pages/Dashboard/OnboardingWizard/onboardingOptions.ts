import {
  Baby,
  Backpack,
  Building2,
  Gem,
  Heart,
  Mountain,
  Palmtree,
  User as UserIcon,
  Users,
  Utensils,
} from "lucide-react";

export type Step = "WELCOME" | "IDENTITY" | "DNA" | "CREW" | "TUTORIAL" | "ACTION";

export const VIBES = [
  {
    id: "Backpacker",
    icon: Backpack,
    label: "Backpacker",
    desc: "Budget & Hostels",
  },
  { id: "Luxury", icon: Gem, label: "Luxury", desc: "Comfort & Hotels" },
  {
    id: "City",
    icon: Building2,
    label: "City Breaker",
    desc: "Culture & Nightlife",
  },
  {
    id: "Nature",
    icon: Palmtree,
    label: "Nature Lover",
    desc: "Beach & Hiking",
  },
  { id: "Foodie", icon: Utensils, label: "Foodie", desc: "Local Eats" },
  {
    id: "Adventure",
    icon: Mountain,
    label: "Adventurer",
    desc: "Thrills & Action",
  },
];

export const CREWS = [
  {
    id: "Solo",
    icon: UserIcon,
    label: "Solo Traveler",
    desc: "Just me and the world",
  },
  { id: "Couple", icon: Heart, label: "Couple", desc: "Romantic getaways" },
  { id: "Friends", icon: Users, label: "Friends Group", desc: "Squad on tour" },
  { id: "Family", icon: Baby, label: "Family", desc: "Making memories" },
];
