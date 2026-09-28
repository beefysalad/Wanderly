import type { Metadata } from "next";
import AboutComponent from "../components/pages/About";

export const metadata: Metadata = {
  title: "About",
  description:
    "Wanderly replaces scattered chats, stale spreadsheets and payment confusion with one clear place to plan, decide and travel together.",
};

const AboutPage = () => {
  return <AboutComponent />;
};

export default AboutPage;
