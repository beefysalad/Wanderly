import type { Metadata } from "next";
import FeaturesComponent from "../components/pages/Features";

export const metadata: Metadata = {
  title: "Features",
  description:
    "A shared schedule, a running tab and a code that lets anyone in: the three things Wanderly does for group trips.",
};

const FeaturesPage = () => {
  return <FeaturesComponent />;
};

export default FeaturesPage;
