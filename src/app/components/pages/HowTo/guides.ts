export interface Guide {
  /** Anchor used by links such as /how-to#save-to-home-screen. */
  id: string;
  title: string;
  blurb: string;
  steps: string[];
}

export const GUIDES: Guide[] = [
  {
    id: "creating-a-group",
    title: "Creating a group",
    blurb: "Your first travel group",
    steps: [
      "From the dashboard, hit New group and give it a name — usually the destination and the year is enough.",
      "Wanderly generates a six-character code for the group. That code is how everyone else gets in.",
      "Copy the code or the invite link and drop it in your group chat.",
      "Anyone who joins becomes a member and can add activities and expenses straight away.",
    ],
  },
  {
    id: "joining-a-group",
    title: "Joining a group",
    blurb: "Get in with a code",
    steps: [
      "Ask whoever set it up for the six-character group code.",
      "Open the join page and type the code — it moves to the next box as you go.",
      "Logged in, you join as a full member. Not logged in, you get the read-only guest view.",
      "The group shows up on your dashboard from then on.",
    ],
  },
  {
    id: "creating-a-trip",
    title: "Creating a trip",
    blurb: "A trip inside a group",
    steps: [
      "Open the group and choose New trip.",
      "Name the trip and set the start and end dates — the calendar builds itself from those.",
      "Save it, and every member sees the trip immediately.",
      "You can run several trips in one group; the expense ledger stays per trip.",
    ],
  },
  {
    id: "adding-activities",
    title: "Adding activities",
    blurb: "Fill in the schedule",
    steps: [
      "Open the trip and pick a day in the calendar view.",
      "Hit Add activity, then set the time, the title and — optionally — a pickup or drop-off point.",
      "Drag activities to reorder them when the plan shifts.",
      "Tick an activity off during the trip so everyone knows it's done.",
    ],
  },
  {
    id: "managing-expenses",
    title: "Managing expenses",
    blurb: "Track and split money",
    steps: [
      "In the trip, open Expenses and choose Add expense.",
      "Enter the amount, pick a category, and say who paid.",
      "Choose who it's split between — everyone, or just the people who came along.",
      "Wanderly keeps the running balance. Mark a payment received and it's logged for the group.",
    ],
  },
  {
    id: "exporting-to-calendar",
    title: "Exporting to calendar",
    blurb: "Get it on your phone",
    steps: [
      "Open the trip and choose Export.",
      "Download the .ics file, which works with Google Calendar, Apple Calendar and Outlook.",
      "Open the file on your phone and confirm the import.",
      "Re-export after big changes — the .ics is a snapshot, not a live sync.",
    ],
  },
  {
    id: "save-to-home-screen",
    title: "Save to home screen",
    blurb: "Use it like an app",
    steps: [
      "Open Wanderly in your phone browser.",
      "On iPhone, tap Share then Add to Home Screen. On Android, open the browser menu and tap Install app.",
      "It launches full-screen with no address bar — near enough to a native app.",
      "That covers it until the native apps land.",
    ],
  },
];
