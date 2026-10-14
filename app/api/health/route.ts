import { jsonError } from "@/lib/http";
import { readModelStatus } from "@/lib/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const model = await readModelStatus();
    return Response.json({ model });
  } catch (error) {
    console.error(error);
    return jsonError("Couldn't check whether Gemma is awake.", 500);
  }
}
