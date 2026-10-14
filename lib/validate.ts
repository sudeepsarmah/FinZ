import {
  CADENCES,
  EMOTIONS,
  RISKS,
  TIMELINES,
  type Cadence,
  type Direction,
  type Emotion,
  type Risk,
  type Timeline,
} from "@/lib/catalog";

export function parseDollars(input: unknown): number | null {
  const cleaned = String(input ?? "")
    .trim()
    .replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0 || value > 10_000_000) return null;
  return Math.round(value * 100) / 100;
}

export function dollarsToCents(dollars: number) {
  return Math.round(dollars * 100);
}

const emotionSet = new Set<string>(EMOTIONS.map((emotion) => emotion.slug));
const cadenceSet = new Set<string>(CADENCES.map((cadence) => cadence.slug));
const riskSet = new Set<string>(RISKS.map((risk) => risk.slug));
const timelineSet = new Set<string>(TIMELINES.map((timeline) => timeline.slug));

export function asEmotion(value: unknown): Emotion | null {
  const slug = String(value ?? "").trim().toLowerCase();
  return emotionSet.has(slug) ? (slug as Emotion) : null;
}

export function asCadence(value: unknown): Cadence | null {
  const slug = String(value ?? "").trim();
  return cadenceSet.has(slug) ? (slug as Cadence) : null;
}

export function asRisk(value: unknown): Risk | null {
  const slug = String(value ?? "").trim();
  return riskSet.has(slug) ? (slug as Risk) : null;
}

export function asTimeline(value: unknown): Timeline | null {
  const slug = String(value ?? "").trim();
  return timelineSet.has(slug) ? (slug as Timeline) : null;
}

export function asDirection(value: unknown): Direction | null {
  const slug = String(value ?? "").trim();
  return slug === "in" || slug === "out" ? slug : null;
}

export type DreamDraft = {
  name: string;
  target: number;
  why: string;
  timeline: Timeline;
};

export type ProfileDraft = {
  name: string;
  takeHome: number;
  cadence: Cadence;
  risk: Risk;
  dreams: DreamDraft[];
};

export type EntryDraft = {
  amount: number;
  direction: Direction;
  label: string;
  emotion: Emotion;
  note: string;
  rawNote: string | null;
};

export function validateProfile(input: unknown): { ok: true; value: ProfileDraft } | { ok: false; error: string } {
  const body = asRecord(input);
  const name = cleanText(body.name, 40);
  if (!name) return { ok: false, error: "We need something to call you." };

  const takeHome = parseDollars(body.takeHome);
  if (takeHome == null) {
    return {
      ok: false,
      error: "Take-home has to be a number bigger than zero. The amount that actually lands.",
    };
  }

  const cadence = asCadence(body.cadence);
  if (!cadence) return { ok: false, error: "Pick how often the paycheck shows up." };

  const risk = asRisk(body.risk);
  if (!risk) return { ok: false, error: "Pick how jumpy the long-term money can be." };

  if (!Array.isArray(body.dreams) || body.dreams.length < 1 || body.dreams.length > 3) {
    return { ok: false, error: "Bring one to three dreams. One is enough." };
  }

  const dreams: DreamDraft[] = [];
  for (let index = 0; index < body.dreams.length; index += 1) {
    const dream = asRecord(body.dreams[index]);
    const dreamName = cleanText(dream.name, 60);
    const why = cleanText(dream.why, 280);
    const timeline = asTimeline(dream.timeline);
    const target = parseDollars(dream.target);
    const label = `Dream ${index + 1}`;
    if (!dreamName) return { ok: false, error: `${label} needs a name.` };
    if (target == null) return { ok: false, error: `${label} needs a target amount.` };
    if (!why) return { ok: false, error: `${label} needs a why. One sentence is plenty.` };
    if (!timeline) return { ok: false, error: `${label} needs a rough timeline.` };
    dreams.push({ name: dreamName, target, why, timeline });
  }

  return { ok: true, value: { name, takeHome, cadence, risk, dreams } };
}

export function validateEntry(input: unknown): { ok: true; value: EntryDraft } | { ok: false; error: string } {
  const body = asRecord(input);
  const amount = parseDollars(body.amount);
  if (amount == null) return { ok: false, error: "Add an amount bigger than zero before this hits the desk." };

  const direction = asDirection(body.direction);
  if (!direction) return { ok: false, error: "Mark it as money in or money out." };

  const label = cleanText(body.label, 48);
  if (!label) return { ok: false, error: "Give it a short label. Matcha is a label. A paragraph isn't." };

  const emotion = asEmotion(body.emotion);
  if (!emotion) return { ok: false, error: "Pick the feeling. Survival, treat, glow-up, ick, soft launch, or chaos." };

  const note = cleanText(body.note, 400) || label;
  const raw = cleanText(body.rawNote, 500);

  return {
    ok: true,
    value: { amount, direction, label, emotion, note, rawNote: raw || null },
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function cleanText(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
