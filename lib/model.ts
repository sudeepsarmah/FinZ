export const MODEL_ID = process.env.OLLAMA_MODEL ?? "gemma3:1b";
export const OLLAMA_HOST = (
  process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434"
).replace(/\/$/, "");

export async function readModelStatus(): Promise<{
  id: string;
  online: boolean;
}> {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return { id: MODEL_ID, online: false };
    const body = (await response.json()) as { models?: Array<{ name: string }> };
    const online = (body.models ?? []).some(
      (model) => model.name === MODEL_ID || model.name.startsWith(`${MODEL_ID}:`),
    );
    return { id: MODEL_ID, online };
  } catch {
    return { id: MODEL_ID, online: false };
  }
}
