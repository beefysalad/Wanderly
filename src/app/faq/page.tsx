import type { Metadata } from "next";
import FAQComponent from "@/src/app/components/pages/FAQ";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common Wanderly questions: accounts, joining and inviting, exporting schedules, splitting expenses and pricing.",
};

export default function FAQPage() {
  return <FAQComponent />;
}
