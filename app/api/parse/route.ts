import { parseNote } from "@/lib/agent";
import { jsonError } from "@/lib/http";
import { MODEL_ID } from "@/lib/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("That didn't come through as JSON.");
  }

  const note = String(
    body && typeof body === "object" && "note" in body
      ? (body as { note?: unknown }).note ?? ""
      : "",
  )
    .replace(/\s+/g, " ")
    .trim();

  if (note.length < 2) {
    return jsonError("Give me a little more than that. A number helps.");
  }
  if (note.length > 500) {
    return jsonError("That note is a novel. Keep it to a few sentences.");
  }

  try {
    const parsed = await parseNote(note);
    return Response.json({ parsed });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("isn't loaded") || message.toLowerCase().includes("not found")) {
      return jsonError(
        `Gemma isn't on this machine yet. In a terminal: ollama pull ${MODEL_ID}`,
        503,
      );
    }
    return jsonError(
      "Gemma couldn't read that note. Type it in below, or try the sentence again. Nothing left the laptop.",
      502,
    );
  }
}
