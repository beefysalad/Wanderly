import { ChoiceCard } from "./ChoiceCard";
import { StepHeader } from "./StepHeader";
import { CREWS } from "../onboardingOptions";

interface CrewStepProps {
  selectedCrew: string;
  setSelectedCrew: (id: string) => void;
}

export function CrewStep({ selectedCrew, setSelectedCrew }: CrewStepProps) {
  return (
    <div className='mx-auto flex w-full max-w-[880px] flex-col gap-7'>
      <StepHeader eyebrow='Your crew · pick one' title="Who's your crew?" subtitle='Who do you usually explore the world with?' />
      <div className='grid grid-cols-[repeat(auto-fill,minmax(min(160px,100%),1fr))] gap-3'>
        {CREWS.map((crew) => (
          <ChoiceCard
            key={crew.id}
            icon={crew.icon}
            title={crew.label}
            subtitle={crew.desc}
            selected={selectedCrew === crew.id}
            onClick={() => setSelectedCrew(crew.id)}
          />
        ))}
      </div>
    </div>
  );
}
