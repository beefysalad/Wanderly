import type { Metadata } from "next";
import HowToComponent from "@/src/app/components/pages/HowTo";

export const metadata: Metadata = {
  title: "How-to guides",
  description: "Short step-by-step guides to every Wanderly screen, from creating a group to settling expenses.",
};

export default function HowToPage() {
  return <HowToComponent />;
}
