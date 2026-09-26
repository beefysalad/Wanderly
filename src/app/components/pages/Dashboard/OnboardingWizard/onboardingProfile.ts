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

const CREW_LABEL_BY_BIO_TEXT: Record<string, string> = {
  [CREW_BIO_TEXT.Solo]: "Solo Traveler",
  [CREW_BIO_TEXT.Couple]: "Couple",
  [CREW_BIO_TEXT.Friends]: "Friends Group",
  [CREW_BIO_TEXT.Family]: "Family",
};

/** Splits a bio back into what the user wrote and the two answers onboarding appended to it. */
export function parseProfileBio(bio: string | undefined | null) {
  const about: string[] = [];
  let bucketList: string | null = null;
  let crew: string | null = null;

  for (const line of (bio ?? "").split("\n")) {
    const text = line.trim();
    if (!text) continue;
    if (text.startsWith("Dreaming of ")) {
      bucketList = text.slice("Dreaming of ".length).replace(/\s*🌍$/u, "").trim() || null;
    } else if (CREW_LABEL_BY_BIO_TEXT[text]) {
      crew = CREW_LABEL_BY_BIO_TEXT[text];
    } else {
      about.push(text);
    }
  }

  return { about: about.join("\n"), bucketList, crew };
}
