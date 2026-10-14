import { jsonError } from "@/lib/http";
import { buildSummary } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await buildSummary();
    if (!summary) return jsonError("The desk isn't open yet.", 404);
    return Response.json(summary);
  } catch (error) {
    console.error(error);
    return jsonError("The desk drawer stuck. Your notes are still on this machine.", 500);
  }
}
