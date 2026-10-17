import { asCurrency } from "@/lib/currency";
import { jsonError } from "@/lib/http";
import { readModelStatus } from "@/lib/model";
import { createProfile, getProfile, updateCurrency, updatePaycheck } from "@/lib/queries";
import { asCadence, dollarsToCents, parseDollars, validateProfile } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const profile = getProfile();
  if (!profile) return jsonError("The desk isn't open yet.", 404);
  const model = await readModelStatus();
  return Response.json({ profile, model });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("That didn't come through as JSON.");
  }

  const parsed = validateProfile(body);
  if (!parsed.ok) return jsonError(parsed.error);

  try {
    createProfile(parsed.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn't open the desk.";
    const status = message.includes("already open") ? 409 : 500;
    if (status === 500) console.error(error);
    return jsonError(message, status);
  }

  return Response.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("That didn't come through as JSON.");
  }
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const currency = record.currency == null ? null : asCurrency(record.currency);
  if (record.currency != null && !currency) {
    return jsonError("Pick dollars, rupees, euros, or pounds.");
  }

  const wantsPaycheck = record.takeHome != null || record.cadence != null;

  try {
    if (currency) updateCurrency(currency);
    if (wantsPaycheck) {
      const profile = getProfile();
      if (!profile) return jsonError("The desk isn't open yet.", 404);
      const takeHome = record.takeHome == null ? profile.takeHomeCents / 100 : parseDollars(record.takeHome);
      const cadence = record.cadence == null ? profile.cadence : asCadence(record.cadence);
      if (takeHome == null || !cadence) return jsonError("Take-home has to be a number, and cadence has to be weekly, every other week, or monthly.");
      updatePaycheck(record.takeHome == null ? profile.takeHomeCents : dollarsToCents(takeHome), cadence);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn't update the desk.";
    return jsonError(message, message.includes("isn't open") ? 404 : 500);
  }
  return Response.json({ ok: true });
}
