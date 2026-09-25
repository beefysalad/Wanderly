const CREW_BIO_TEXT: Record<string, string> = {
  Solo: "Solo Traveler 🎒",
  Couple: "Travels as a Couple 💑",
  Friends: "Travels with Friends 👯‍♂️",
  Family: "Travels with Family 👨‍👩‍👧‍👦",
};

/**
 * Appends the onboarding answers (bucket-list dream, travel crew) to the user's existing bio,
 * one per line, without duplicating text that is already there.
 */
export function buildBioUpdate(currentBio: string, bucketList: string, selectedCrew: string): string {
  let bioUpdate = currentBio;

  // Format: "Dreaming of [Place] 🌍"
  if (bucketList && !bioUpdate.includes("Dreaming of")) {
    bioUpdate = bioUpdate ? `${bioUpdate}\n` : "";
    bioUpdate += `Dreaming of ${bucketList} 🌍`;
  }

  // Format: "Travels as a Couple 💑", "Solo Traveler 🎒", etc.
  const crewText = selectedCrew ? CREW_BIO_TEXT[selectedCrew] ?? "" : "";
  if (crewText && !bioUpdate.includes(crewText)) {
    bioUpdate = bioUpdate ? `${bioUpdate}\n` : "";
    bioUpdate += crewText;
  }

  return bioUpdate;
}

export interface OnboardingAnswers {
  displayName: string;
  imageUrl: string;
  bucketList: string;
  selectedVibes: string[];
  selectedCrew: string;
}

/** The profile fields to PATCH: only what the user filled in, and the bio only if it changed. */
export function buildProfileUpdates(currentBio: string, answers: OnboardingAnswers) {
  const updates: Record<string, string> = {};

  if (answers.displayName) updates.name = answers.displayName;
  if (answers.imageUrl) updates.imageUrl = answers.imageUrl;
  if (answers.selectedVibes.length > 0) updates.travelStyle = answers.selectedVibes.join(", ");

  const bioUpdate = buildBioUpdate(currentBio, answers.bucketList, answers.selectedCrew);
  if (bioUpdate !== currentBio) {
    updates.bio = bioUpdate;
  }

  return updates;
}
