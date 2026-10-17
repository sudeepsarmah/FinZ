export const MODEL_ID = process.env.OLLAMA_MODEL ?? "gemma3:4b";
export const OLLAMA_HOST = (
  process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434"
).replace(/\/$/, "");

export type GemmaStatus = {
  id: string;
  ollama: "up" | "down";
  modelReady: boolean;
};

export async function readModelStatus(): Promise<GemmaStatus> {
  const hosts = [...new Set([OLLAMA_HOST, "http://127.0.0.1:11434", "http://localhost:11434"])];
  for (const host of hosts) {
    try {
      const response = await fetch(`${host}/api/tags`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) continue;
      const body = (await response.json()) as { models?: Array<{ name: string }> };
      const names = (body.models ?? []).map((model) => model.name);
      return {
        id: MODEL_ID,
        ollama: "up",
        modelReady: names.some((name) => name === MODEL_ID || name.startsWith(`${MODEL_ID}:`)),
      };
    } catch {
      continue;
    }
  }
  return { id: MODEL_ID, ollama: "down", modelReady: false };
}

export function ollamaErrorMessage(status: GemmaStatus) {
  if (status.ollama === "down") {
    return "Ollama isn't reachable on this computer. Open the Ollama app, then refresh.";
  }
  if (!status.modelReady) {
    return `Ollama is running, but ${status.id} isn't downloaded yet. In a terminal: ollama pull ${status.id}`;
  }
  return null;
}
