import { asCurrency } from "@/lib/currency";
import { jsonError } from "@/lib/http";
import { readModelStatus } from "@/lib/model";
import { createProfile, getProfile, updateCurrency } from "@/lib/queries";
import { validateProfile } from "@/lib/validate";

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
  const currency = asCurrency(
    body && typeof body === "object" && "currency" in body
      ? (body as { currency?: unknown }).currency
      : null,
  );
  if (!currency) return jsonError("Pick dollars, rupees, euros, or pounds.");
  try {
    updateCurrency(currency);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn't switch the currency.";
    return jsonError(message, message.includes("isn't open") ? 404 : 500);
  }
  return Response.json({ ok: true, currency });
}
