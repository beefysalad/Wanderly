import { SiteShell } from "../../shared/Site/SiteShell";
import { FeatureCards } from "./FeatureCards";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { LandingFooter } from "./LandingFooter";
import { PromiseSection } from "./PromiseSection";

const LandingPage = () => {
  return (
    <SiteShell roomyNav footer={<LandingFooter />}>
      <Hero />
      <FeatureCards />
      <PromiseSection />
      <FinalCta />
    </SiteShell>
  );
};

export default LandingPage;
