import { jsonError } from "@/lib/http";
import { getProfile, insertEntry } from "@/lib/queries";
import { validateEntry } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!getProfile()) return jsonError("Open the desk before logging a note.", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("That didn't come through as JSON.");
  }

  const parsed = validateEntry(body);
  if (!parsed.ok) return jsonError(parsed.error);

  try {
    const entry = insertEntry(parsed.value);
    return Response.json({ entry }, { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError("The note didn't land in the ledger. Try saving again.", 500);
  }
}
