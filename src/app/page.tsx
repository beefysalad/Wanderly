import { isDev } from "@/lib/helper";
import type { Metadata } from "next";
import LandingPage from "./components/pages/LandingPage";

export const metadata: Metadata = {
  // The root layout's title template skips pages in its own segment, so the landing page spells its title out.
  title: `Wanderly: plan group trips together${isDev() ? " (Development)" : ""}`,
  description:
    "One shared itinerary, one expense ledger and a six-character code that lets the whole group in. Plan the trip, split the costs, settle up.",
};

export default function Home() {
  return <LandingPage />;
}
