export const ALL_FEATURES = [
  "guests",
  "seating",
  "dietary",
  "budget",
  "chatbot",
  "news",
  "letters",
] as const;

export type Feature = (typeof ALL_FEATURES)[number];

export const FEATURE_LABELS: Record<Feature, string> = {
  guests: "Guest RSVP Management",
  seating: "Seating & Table Planner",
  dietary: "Dietary & Accessibility Tracker",
  budget: "Budget Manager",
  chatbot: "AI Assistant Chatbot",
  news: "News & Updates Feed",
  letters: "Letters to the Couple",
};
