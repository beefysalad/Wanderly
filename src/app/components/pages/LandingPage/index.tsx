import { Features } from "./Features";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { PromiseSection } from "./PromiseSection";

const LandingPage = () => {
  return (
    <main className='relative min-h-screen overflow-x-hidden bg-[#020617] font-[family-name:var(--font-geist-sans)] leading-[normal] text-[#f8fafc]'>
      {/* Faint grid that fades out towards the bottom of the viewport */}
      <div
        aria-hidden
        className='pointer-events-none fixed inset-0 z-0 [background-image:linear-gradient(rgba(148,163,184,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.055)_1px,transparent_1px)] [background-size:72px_72px] [-webkit-mask-image:radial-gradient(ellipse_90%_60%_at_50%_0%,#000_30%,transparent_75%)] [mask-image:radial-gradient(ellipse_90%_60%_at_50%_0%,#000_30%,transparent_75%)]'
      />

      <LandingHeader />
      <Hero />
      <Features />
      <PromiseSection />
      <FinalCta />
      <LandingFooter />
    </main>
  );
};

export default LandingPage;
