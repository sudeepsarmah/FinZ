import { writeReflection } from "@/lib/agent";
import { jsonError } from "@/lib/http";
import { readModelStatus, ollamaErrorMessage } from "@/lib/model";
import { dreamContext, listDreamRows } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const dreamId = await readDreamId(request);
  if (dreamId == null) return jsonError("Which dream are we talking about?");

  const context = dreamContext(dreamId);
  if (!context) return jsonError("That dream isn't on the desk.", 404);

  try {
    const reflection = await writeReflection({
      profile: context.profile,
      dreamName: context.dream.name,
      entries: context.entries,
      dreams: listDreamRows(),
    });
    return Response.json({ reflection });
  } catch (error) {
    console.error(error);
    return await modelFailure(error);
  }
}

async function readDreamId(request: Request) {
  try {
    const body = (await request.json()) as { dreamId?: unknown };
    const dreamId = Number(body.dreamId);
    return Number.isInteger(dreamId) && dreamId > 0 ? dreamId : null;
  } catch {
    return null;
  }
}

async function modelFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.startsWith("OLLAMA_DOWN") || message.startsWith("MODEL_MISSING")) {
    const status = await readModelStatus();
    return jsonError(ollamaErrorMessage(status) ?? "Gemma isn't ready.", 503);
  }
  return jsonError(
    "Gemma stalled before it finished. Nothing left the laptop. Try another pass.",
    502,
  );
}
