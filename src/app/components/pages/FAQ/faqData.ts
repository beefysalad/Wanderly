export const FAQ_CATEGORIES = ["All", "The basics", "Group coordination", "Planning & tech", "Money & security"] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export interface FaqItem {
  category: Exclude<FaqCategory, "All">;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    category: "The basics",
    question: "What is Wanderly?",
    answer:
      "A group trip planner: one shared schedule, one expense ledger, and a six-character code that lets your whole group in. It replaces the chat-plus-spreadsheet setup most groups end up with.",
  },
  {
    category: "The basics",
    question: "Do I need an account?",
    answer:
      "To create or edit a trip, yes. To look at one, no — anyone with the group code gets a read-only view of the schedule and what's owed, with no signup.",
  },
  {
    category: "The basics",
    question: "Is it free?",
    answer:
      "Yes — free while it's in beta. If that ever changes, you'll know well before it does, not from a surprise paywall.",
  },
  {
    category: "Group coordination",
    question: "How do I join a group?",
    answer:
      "Ask whoever made the trip for the six-character code, then enter it on the join page. If you have an account you'll be added as a member; if not, you get the guest view.",
  },
  {
    category: "Group coordination",
    question: "How do I invite friends?",
    answer:
      "Share the group code or the invite link. There's no seat limit and no per-person setup — the code is the entire invite system.",
  },
  {
    category: "Group coordination",
    question: "Can I delete a trip or group?",
    answer:
      "Yes. Group owners can delete a trip or the whole group from its settings. Deleting a group removes its trips, activities and expenses, so it asks you to confirm first.",
  },
  {
    category: "Planning & tech",
    question: "What's the difference between Calendar and Schedule views?",
    answer:
      "Calendar shows the shape of the trip — which days are busy, which are free. Schedule is the hour-by-hour list for a single day, with times, pickups and tick-offs.",
  },
  {
    category: "Planning & tech",
    question: "How do I export my schedule?",
    answer:
      "Open the trip and export it as an .ics file, which imports into Google Calendar, Apple Calendar or Outlook. You can also save a shareable image of the day.",
  },
  {
    category: "Planning & tech",
    question: "What is an .ics file?",
    answer:
      "It's the standard calendar file format. Opening one adds the trip's activities to whichever calendar app you already use, so the plan shows up next to the rest of your week.",
  },
  {
    category: "Planning & tech",
    question: "Is there a mobile app?",
    answer:
      "Not yet. The web version works on a phone, and you can add it to your home screen so it opens like an app. Native iOS and Android are planned.",
  },
  {
    category: "Money & security",
    question: "How does expense splitting work?",
    answer:
      "Log what you paid, pick who it's split between, and Wanderly keeps the running balance per person. Mark a payment as received and it's logged for everyone to see.",
  },
  {
    category: "Money & security",
    question: "How do people pay me back?",
    answer:
      "However you like — cash, bank transfer, GCash or Maya. You can attach your QR to your profile so people can settle up without asking for your details again.",
  },
  {
    category: "Money & security",
    question: "Is my data secure?",
    answer:
      "Accounts are password-protected, and guests only ever get a read-only view. Member emails and payment details are hidden from guests, and nothing is sold or shared with advertisers.",
  },
];
