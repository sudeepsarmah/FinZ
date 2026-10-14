export const EMOTIONS = [
  {
    slug: "survival",
    label: "Survival",
    blurb: "Keeps the lights on",
  },
  {
    slug: "treat",
    label: "Treat",
    blurb: "A small yes",
  },
  {
    slug: "glow-up",
    label: "Glow-up",
    blurb: "How you show up",
  },
  {
    slug: "ick",
    label: "Ick",
    blurb: "Wish you could unsend it",
  },
  {
    slug: "soft-launch",
    label: "Soft launch",
    blurb: "Trying a future, cheaply",
  },
  {
    slug: "chaos",
    label: "Chaos",
    blurb: "No thesis. It happened.",
  },
] as const;

export const CADENCES = [
  { slug: "weekly", label: "Every week", phrase: "every week" },
  { slug: "biweekly", label: "Every other week", phrase: "every other week" },
  { slug: "monthly", label: "Once a month", phrase: "once a month" },
] as const;

export const RISKS = [
  {
    slug: "steady",
    label: "Keep it boring",
    blurb: "I'd rather not watch it swing.",
  },
  {
    slug: "balanced",
    label: "A little movement",
    blurb: "A dip is fine if I know why it's there.",
  },
  {
    slug: "game",
    label: "I can watch a red week",
    blurb: "I won't panic-sell the long money.",
  },
] as const;

export const TIMELINES = [
  { slug: "this year", label: "This year" },
  { slug: "a couple of years", label: "A couple of years" },
  { slug: "five years", label: "Five years" },
  { slug: "someday, but real", label: "Someday, but real" },
] as const;

export type Emotion = (typeof EMOTIONS)[number]["slug"];
export type Cadence = (typeof CADENCES)[number]["slug"];
export type Risk = (typeof RISKS)[number]["slug"];
export type Timeline = (typeof TIMELINES)[number]["slug"];
export type Direction = "in" | "out";

export function emotionMeta(slug: string) {
  return EMOTIONS.find((emotion) => emotion.slug === slug) ?? EMOTIONS[5];
}

export function cadenceMeta(slug: string) {
  return CADENCES.find((cadence) => cadence.slug === slug) ?? CADENCES[1];
}

export function riskMeta(slug: string) {
  return RISKS.find((risk) => risk.slug === slug) ?? RISKS[1];
}
