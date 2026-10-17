import { sketchAllocation } from "@/lib/agent";
import { jsonError } from "@/lib/http";
import { readModelStatus, ollamaErrorMessage } from "@/lib/model";
import { dreamContext, listDreamRows } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let dreamId: number | null = null;
  try {
    const body = (await request.json()) as { dreamId?: unknown };
    const parsed = Number(body.dreamId);
    dreamId = Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return jsonError("That didn't come through as JSON.");
  }
  if (dreamId == null) return jsonError("Which dream should the sketch start from?");

  const context = dreamContext(dreamId);
  if (!context) return jsonError("That dream isn't on the desk.", 404);

  try {
    const allocation = await sketchAllocation({
      profile: context.profile,
      dreams: listDreamRows(),
      focusDream: context.dream.name,
    });
    return Response.json({ allocation });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("OLLAMA_DOWN") || message.startsWith("MODEL_MISSING")) {
      const status = await readModelStatus();
      return jsonError(ollamaErrorMessage(status) ?? "Gemma isn't ready.", 503);
    }
    return jsonError(
      "The sketch wandered off before it had three buckets. Nothing left the laptop. Try again.",
      502,
    );
  }
}
