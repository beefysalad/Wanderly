import type { Metadata } from "next";
import HowItWorksComponent from "../components/pages/HowItWorks";

export const metadata: Metadata = {
  title: "How it works",
  description: "Make a group, drop in the plan, split the tab: how a trip comes together in Wanderly in three steps.",
};

const HowItWorksPage = () => {
  return <HowItWorksComponent />;
};

export default HowItWorksPage;
