import { jsonError } from "@/lib/http";
import { deleteEntry } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const entryId = Number(id);
  if (!Number.isInteger(entryId) || entryId <= 0) {
    return jsonError("That note id doesn't look real.");
  }
  const removed = deleteEntry(entryId);
  if (!removed) return jsonError("That note is already gone.", 404);
  return Response.json({ ok: true });
}
