import { ChoiceCard } from "./ChoiceCard";
import { StepHeader } from "./StepHeader";
import { VIBES } from "../onboardingOptions";

interface DnaStepProps {
  selectedVibes: string[];
  toggleVibe: (id: string) => void;
}

export function DnaStep({ selectedVibes, toggleVibe }: DnaStepProps) {
  return (
    <div className='mx-auto flex w-full max-w-[880px] flex-col gap-7'>
      <StepHeader
        eyebrow='Travel style · pick any'
        title="What's your vibe?"
        subtitle='Select all that apply to your travel style.'
      />
      <div className='grid grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))] gap-3'>
        {VIBES.map((vibe) => (
          <ChoiceCard
            key={vibe.id}
            mono
            icon={vibe.icon}
            title={vibe.label}
            subtitle={vibe.desc}
            selected={selectedVibes.includes(vibe.id)}
            onClick={() => toggleVibe(vibe.id)}
          />
        ))}
      </div>
    </div>
  );
}
