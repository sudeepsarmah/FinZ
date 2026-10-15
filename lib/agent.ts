import { Agent } from "@mastra/core/agent";
import { createOllama } from "ollama-ai-provider-v2";
import { z } from "zod";
import { EMOTIONS, cadenceMeta, emotionMeta, riskMeta } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { MODEL_ID, OLLAMA_HOST, readModelStatus } from "@/lib/model";
import type { Allocation, Entry, ParsedNote, Profile, Reflection } from "@/lib/types";

const ollama = createOllama({
  baseURL: `${OLLAMA_HOST}/api`,
  compatibility: "strict",
});

export const finzAgent = new Agent({
  id: "finz",
  name: "FinZ",
  instructions: `You are FinZ, the money friend on someone's laptop. They just got a first real paycheck.
Be warm, specific, and a little irreverent. Short sentences. No shame. No corporate tone. No hashtags. No bullet lectures.
Never invent amounts, entries, or dreams that are not in the prompt.
You are not a financial advisor. Allocation sketches only use three buckets: an emergency buffer, cash, and a broad index fund. Never name a ticker, fund company, coin, or individual stock.
When asked for JSON, reply with one JSON object and no markdown.`,
  model: ollama.chat(MODEL_ID, { think: false }),
});

const looseSchema = z
  .object({
    amount: z.union([z.number(), z.string()]).optional(),
    direction: z.string().optional(),
    label: z.string().optional(),
    emotion: z.string().optional(),
    note: z.string().optional(),
    title: z.string().optional(),
    body: z.string().optional(),
    emergencyPercent: z.union([z.number(), z.string()]).optional(),
    cashPercent: z.union([z.number(), z.string()]).optional(),
    indexPercent: z.union([z.number(), z.string()]).optional(),
    headline: z.string().optional(),
    because: z.string().optional(),
  })
  .passthrough();

const emotionAliases: Record<string, ParsedNote["emotion"]> = {
  survival: "survival",
  survive: "survival",
  rent: "survival",
  bills: "survival",
  paycheck: "survival",
  treat: "treat",
  "treat yo self": "treat",
  "glow-up": "glow-up",
  glowup: "glow-up",
  "glow up": "glow-up",
  ick: "ick",
  regret: "ick",
  guilty: "ick",
  "soft-launch": "soft-launch",
  "soft launch": "soft-launch",
  softlaunch: "soft-launch",
  chaos: "chaos",
  messy: "chaos",
};

export async function parseNote(rawNote: string): Promise<ParsedNote> {
  await assertModel();
  const prompt = `Turn this messy money note into JSON.
Rules:
- amount is a number of dollars, taken from the note. If there is no number, use 0.
- direction is "out" when money leaves and "in" when money arrives. A paycheck, deposit, or "got paid" is "in".
- label is 2 to 4 words.
- emotion is exactly one of: ${EMOTIONS.map((emotion) => emotion.slug).join(", ")}.
- If they say it felt like a treat, emotion is treat.
- Rent, groceries, transit passes, and paychecks are survival.
- Something they wish they could unsend is ick.
- A cheap test of a future life is soft-launch.
- Hair, clothes, skincare, a class, anything about how they show up is glow-up.
- Unexplained or "I don't know what that was" is chaos.
- note is one short sentence in their voice. Do not invent a story.

Example note: $14 matcha after a bad standup, felt like a treat
{"amount":14,"direction":"out","label":"Matcha","emotion":"treat","note":"After a bad standup, a small treat."}
Example note: paycheck finally hit 2400
{"amount":2400,"direction":"in","label":"Paycheck","emotion":"survival","note":"Paycheck landed."}

Note: ${rawNote}`;

  const value = await askJson(
    prompt,
    'Return one JSON object with keys amount, direction, label, emotion, note.',
    0.1,
    160,
  );
  return normalizeParse(value, rawNote);
}

export async function writeReflection(input: {
  profile: Profile;
  dreamName: string;
  entries: Entry[];
  dreams: Array<{ name: string; why: string; timeline: string; targetCents: number }>;
}): Promise<Reflection> {
  await assertModel();
  const lines = describeDesk(input.profile, input.dreams, input.entries);
  const prompt = `${lines}

Write a money-mood reflection focused on the dream "${input.dreamName}".
JSON keys: title, body.
title is 4 to 7 words and does not repeat the dream name only.
body is exactly two sentences.
Sentence 1 names a real entry from the list using its label and dollar amount, without scolding.
Sentence 2 names the dream "${input.dreamName}" and why it is still there.
If there are no entries, sentence 1 says the desk is still blank and does not invent a purchase.
No advice. No "you should". No budgets. No shame.
Income is not a purchase. Do not describe a paycheck as if it was spent on the dream.`;

  let reflection = normalizeReflection(
    await askJson(
      prompt,
      "Return one JSON object with keys title and body. body is exactly two sentences.",
      0.6,
      220,
    ),
  );

  const problem = reflectionProblem(
    reflection,
    input.dreamName,
    input.entries,
    input.profile.currency,
  );
  if (problem) {
    const anchor = input.entries[0];
    reflection = normalizeReflection(
      await askJson(
        `${prompt}

Your last reply failed this check: ${problem}
Last title: ${reflection.title}
Last body: ${reflection.body}
Rewrite it.
The title must not be only "${input.dreamName}".
The body must contain the exact dream name "${input.dreamName}".
${
  anchor
    ? `Sentence 1 must contain the exact label "${anchor.label}" and the amount ${formatMoney(anchor.amountCents, input.profile.currency)}. That entry is ${anchor.direction === "in" ? "money in, not a purchase" : "money out"}.`
    : "There are no entries. Do not invent a purchase or a dollar amount."
}
Do not mention any dollar amount that is not in the entries list.`,
        "Return one JSON object with keys title and body.",
        0.2,
        220,
      ),
    );
    const again = reflectionProblem(
      reflection,
      input.dreamName,
      input.entries,
      input.profile.currency,
    );
    if (again) throw new Error(`Reflection failed the check: ${again}`);
  }

  return reflection;
}

export async function sketchAllocation(input: {
  profile: Profile;
  dreams: Array<{ name: string; why: string; timeline: string; targetCents: number }>;
  focusDream: string;
}): Promise<Allocation> {
  await assertModel();
  const risk = riskMeta(input.profile.risk);
  const prompt = `Sketch a starter split for money this person might set aside later. Educational only.
Person: ${input.profile.name}
Take-home: ${formatMoney(input.profile.takeHomeCents, input.profile.currency)} ${cadenceMeta(input.profile.cadence).phrase}
Risk comfort: ${input.profile.risk} — ${risk.label}. ${risk.blurb}
Dreams:
${input.dreams
  .map(
    (dream) =>
      `- ${dream.name} | target ${formatMoney(dream.targetCents, input.profile.currency)} | timeline ${dream.timeline} | why: ${dream.why}`,
  )
  .join("\n")}
The dream they are looking at: ${input.focusDream}

Buckets only: emergency buffer, cash, broad index funds.
Percents are integers that sum to 100.
If a dream timeline is "this year", cash plus emergency should outweigh the index.
If risk is steady, the index is not the biggest bucket.
If risk is game, the index can be the biggest bucket, but emergencyPercent is still at least 15.
Never name a ticker or a fund product.

JSON keys: emergencyPercent, cashPercent, indexPercent, headline, because.
headline is one short line.
because is two sentences that name ${input.focusDream} and the timeline.

Example for a this-year dream, which you should treat as a shape to copy and then adjust, not as this person's numbers:
{"emergencyPercent":40,"cashPercent":35,"indexPercent":25,"headline":"Cash stays louder than the index","because":"Japan with my sister is this year, so the emergency buffer and cash outweigh a broad index fund. The index is still in the sketch, just not the main character."}`;

  const hint =
    "Return one JSON object. emergencyPercent, cashPercent, and indexPercent are integers that sum to 100. If any dream is this year, emergencyPercent + cashPercent must be greater than indexPercent. because must include the dream name.";

  let allocation = normalizeAllocation(
    await askJson(prompt, hint, 0.3, 280),
  );
  const problem = allocationProblem(allocation, input.dreams, input.profile.risk, input.focusDream);
  if (problem) {
    allocation = normalizeAllocation(
      await askJson(
        `${prompt}

Your last sketch failed this check: ${problem}
Last percents: emergency ${allocation.emergencyPercent}, cash ${allocation.cashPercent}, index ${allocation.indexPercent}.
Recompute the three percents so the check passes. Still no tickers.`,
        hint,
        0.2,
        260,
      ),
    );
    const again = allocationProblem(allocation, input.dreams, input.profile.risk, input.focusDream);
    if (again) {
      console.error("allocation rejected", allocation, again);
      throw new Error(`Allocation failed the check: ${again}`);
    }
  }
  return allocation;
}

async function assertModel() {
  const status = await readModelStatus();
  if (!status.online) {
    throw new Error(
      `Model ${MODEL_ID} isn't loaded. Start Ollama and run: ollama pull ${MODEL_ID}`,
    );
  }
}

async function askJson(
  prompt: string,
  hint: string,
  temperature: number,
  maxOutputTokens: number,
) {
  let lastError: unknown;
  let message = prompt;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await finzAgent.generate(message, {
        maxSteps: 1,
        structuredOutput: {
          schema: looseSchema,
          jsonPromptInjection: "inline",
          instructions: hint,
          errorStrategy: "warn",
        },
        modelSettings: {
          temperature,
          maxOutputTokens,
          timeout: { totalMs: 180_000, stepMs: 150_000 },
        },
        providerOptions: {
          ollama: {
            think: false,
            options: {
              temperature,
              num_predict: maxOutputTokens,
              num_ctx: 2048,
            },
          },
        },
      });
      if (result.object && typeof result.object === "object") return result.object;
      if (result.text) return extractJson(result.text);
      throw new Error("Gemma returned an empty page.");
    } catch (error) {
      lastError = error;
      const text = error instanceof Error ? error.message : String(error);
      try {
        return extractJson(text);
      } catch {
        message = `${prompt}\n\nYour previous reply was not usable JSON. Reply with one JSON object and nothing else.`;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Gemma stalled.");
}

function normalizeParse(value: unknown, rawNote: string): ParsedNote {
  const parsed = looseSchema.parse(value);
  const amountNumber = toNumber(parsed.amount);
  const amount =
    amountNumber != null && amountNumber > 0
      ? Math.round(amountNumber * 100) / 100
      : 0;
  const directionText = String(parsed.direction ?? "").toLowerCase();
  const direction: ParsedNote["direction"] =
    directionText.includes("in") || directionText.includes("income") ? "in" : "out";
  const emotion = matchEmotion(parsed.emotion) ?? inferEmotion(rawNote) ?? "chaos";
  const label = clip(parsed.label, 48) || clip(rawNote, 32) || "Note";
  const note = clip(parsed.note, 280) || clip(rawNote, 280);
  return { amount, direction, label, emotion, note };
}

function normalizeReflection(value: unknown): Reflection {
  const parsed = looseSchema.parse(value);
  const title = clip(cleanProse(parsed.title ?? ""), 80);
  const body = firstSentences(cleanProse(parsed.body ?? ""), 2);
  if (!title || !body) throw new Error("The reflection came back thin.");
  return { title, body };
}

function normalizeAllocation(value: unknown): Allocation {
  const parsed = looseSchema.parse(value);
  const emergency = toNumber(parsed.emergencyPercent);
  const cash = toNumber(parsed.cashPercent);
  const index = toNumber(parsed.indexPercent);
  if (emergency == null || cash == null || index == null) {
    throw new Error("The sketch didn't include three buckets.");
  }
  const [emergencyPercent, cashPercent, indexPercent] = normalizePercents(
    emergency,
    cash,
    index,
  );
  const headline = clip(stripProducts(cleanProse(parsed.headline ?? "")), 90);
  const because = firstSentences(stripProducts(cleanProse(parsed.because ?? "")), 3);
  if (!headline || !because) throw new Error("The sketch came back without a reason.");
  return { emergencyPercent, cashPercent, indexPercent, headline, because };
}

function mentionsName(text: string, name: string) {
  const haystack = text.toLowerCase();
  const needle = name.toLowerCase().trim();
  if (haystack.includes(needle)) return true;
  const skip = new Set(["with", "this", "that", "your", "from", "into", "about", "have"]);
  const words = needle
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3 && !skip.has(word));
  return words.length > 0 && words.every((word) => haystack.includes(word));
}

function reflectionProblem(
  reflection: Reflection,
  dreamName: string,
  entries: Entry[],
  currency: Profile["currency"],
) {
  const haystack = `${reflection.title} ${reflection.body}`;
  if (reflection.title.trim().toLowerCase() === dreamName.trim().toLowerCase()) {
    return "The title is only the dream name.";
  }
  if (!mentionsName(haystack, dreamName)) {
    return `The dream "${dreamName}" is missing.`;
  }
  if (entries.length > 0) {
    const mentioned = entries.some((entry) =>
      haystack.toLowerCase().includes(entry.label.toLowerCase()),
    );
    if (!mentioned) {
      return `None of these labels appear: ${entries.map((entry) => entry.label).join(" | ")}.`;
    }
  }
  const allowed = new Set(
    entries.map((entry) => formatMoney(entry.amountCents, currency).replace(/[^\d.]/g, "")),
  );
  const mentionedAmounts =
    reflection.body.match(/(?:[$₹€£]|Rs\.?\s*)\d[\d,]*(?:\.\d+)?/g) ?? [];
  for (const amount of mentionedAmounts) {
    const digits = amount.replace(/[^\d.]/g, "");
    if (!allowed.has(digits)) {
      return `${amount} is not an amount from the entries.`;
    }
  }
  return null;
}

function allocationProblem(
  allocation: Allocation,
  dreams: Array<{ name: string; timeline: string }>,
  risk: Profile["risk"],
  focusDream: string,
) {
  const safe = allocation.emergencyPercent + allocation.cashPercent;
  if (
    dreams.some((dream) => dream.timeline === "this year") &&
    allocation.indexPercent >= safe
  ) {
    return "A this-year dream needs emergency plus cash to be greater than the index percent.";
  }
  if (
    risk === "steady" &&
    allocation.indexPercent >= allocation.emergencyPercent &&
    allocation.indexPercent >= allocation.cashPercent
  ) {
    return "Steady risk means the index is not the biggest bucket.";
  }
  if (risk === "game" && allocation.emergencyPercent < 15) {
    return "Keep the emergency buffer at 15 percent or more.";
  }
  if (!mentionsName(allocation.because, focusDream)) {
    return `The because text must mention "${focusDream}".`;
  }
  return null;
}

function normalizePercents(emergency: number, cash: number, index: number) {
  const raw = [emergency, cash, index].map((value) => Math.max(0, value));
  const sum = raw.reduce((total, value) => total + value, 0);
  if (sum <= 0) throw new Error("The sketch's buckets were empty.");
  const scaled = raw.map((value) => Math.round((value / sum) * 100));
  const drift = 100 - scaled.reduce((total, value) => total + value, 0);
  const largest = scaled.indexOf(Math.max(...scaled));
  scaled[largest] += drift;
  return scaled as [number, number, number];
}

function matchEmotion(value: unknown): ParsedNote["emotion"] | null {
  const text = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  if (!text) return null;
  if (emotionAliases[text]) return emotionAliases[text];
  const found = EMOTIONS.find(
    (emotion) => text.includes(emotion.slug) || text.includes(emotion.label.toLowerCase()),
  );
  return found?.slug ?? null;
}

function inferEmotion(note: string): ParsedNote["emotion"] | null {
  const text = note.toLowerCase();
  if (text.includes("treat")) return "treat";
  if (text.includes("ick") || text.includes("regret")) return "ick";
  if (text.includes("glow")) return "glow-up";
  if (text.includes("soft launch")) return "soft-launch";
  if (text.includes("chaos")) return "chaos";
  if (text.includes("rent") || text.includes("paycheck") || text.includes("grocer")) {
    return "survival";
  }
  return null;
}

function describeDesk(
  profile: Profile,
  dreams: Array<{ name: string; why: string; timeline: string; targetCents: number }>,
  entries: Entry[],
) {
  const entryLines =
    entries.length === 0
      ? "No entries yet."
      : entries
          .map(
            (entry) =>
              `- ${entry.direction.toUpperCase()} ${formatMoney(entry.amountCents, profile.currency)} ${entry.label} | ${emotionMeta(entry.emotion).label} | ${entry.note}`,
          )
          .join("\n");
  const dreamLines = dreams
    .map(
      (dream) =>
        `- ${dream.name} | target ${formatMoney(dream.targetCents, profile.currency)} | ${dream.timeline} | ${dream.why}`,
    )
    .join("\n");
  return `Name: ${profile.name}
Take-home: ${formatMoney(profile.takeHomeCents, profile.currency)} ${cadenceMeta(profile.cadence).phrase}
Risk: ${profile.risk}
Dreams:
${dreamLines}
Recent entries, newest first:
${entryLines}`;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = (fenced?.[1] ?? text).replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no json");
  return JSON.parse(source.slice(start, end + 1));
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[%$,\s]/g, "");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function clip(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanProse(value: string) {
  return value
    .replace(/^```[\s\S]*?```/g, "")
    .replace(/^(okay|ok|sure|here(?:'|’)s|here is|absolutely)[^.!?]{0,80}[.!:\-]\s+/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

function firstSentences(value: string, count: number) {
  const parts = value
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.slice(0, count).join(" ");
}

function stripProducts(value: string) {
  return value.replace(/\b(VOO|VTI|SPY|QQQ|VTSAX|VFIAX|FXAIX)\b/gi, "a broad index fund");
}
