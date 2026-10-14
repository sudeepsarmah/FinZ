export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const host = (process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL ?? "gemma3:4b";
  void fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Reply with ok" }],
      stream: false,
      keep_alive: "45m",
      options: { num_predict: 1, temperature: 0 },
    }),
  }).catch(() => undefined);
}
