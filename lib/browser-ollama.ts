import { EMOTIONS } from "@/lib/catalog";
import type { ParsedNote } from "@/lib/types";

const HOSTS = ["http://127.0.0.1:11434", "http://localhost:11434"];

export async function probeBrowserOllama(modelId = "gemma3:4b") {
  for (const host of HOSTS) {
    try {
      const response = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(2500) });
      if (!response.ok) continue;
      const body = (await response.json()) as { models?: Array<{ name: string }> };
      const modelReady = (body.models ?? []).some(
        (model) => model.name === modelId || model.name.startsWith(`${modelId}:`),
      );
      return { id: modelId, ollama: "up" as const, modelReady, host };
    } catch {
      continue;
    }
  }
  return null;
}

export async function parseNoteInBrowser(note: string): Promise<ParsedNote | null> {
  const probe = await probeBrowserOllama();
  if (!probe?.modelReady) return null;
  const response = await fetch(`${probe.host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(90000),
    body: JSON.stringify({
      model: probe.id,
      stream: false,
      messages: [
        {
          role: "user",
          content: `Turn this money note into one JSON object with keys amount, direction, label, emotion, note.
amount is a number. direction is "out" or "in". emotion is one of: ${EMOTIONS.map((item) => item.slug).join(", ")}.
Example: $14 matcha after a bad standup, felt like a treat
{"amount":14,"direction":"out","label":"Matcha","emotion":"treat","note":"After a bad standup, a small treat."}
Note: ${note}`,
        },
      ],
      options: { temperature: 0.1, num_predict: 160 },
    }),
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { message?: { content?: string } };
  const text = body.message?.content ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<ParsedNote>;
  const amount = Number(parsed.amount);
  const direction = parsed.direction === "in" ? "in" : "out";
  const emotion = EMOTIONS.find((item) => item.slug === parsed.emotion)?.slug ?? "chaos";
  return {
    amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
    direction,
    label: String(parsed.label || "Note").slice(0, 48),
    emotion,
    note: String(parsed.note || note).slice(0, 280),
  };
}
