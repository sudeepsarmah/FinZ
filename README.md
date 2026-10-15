# FinZ

A local-first money desk for the first real paycheck. Dreams and feelings up front, a spreadsheet nowhere. Gemma reads a messy note on your laptop. Mastra is the agent harness. Income, expenses, and dreams stay in a SQLite file on the machine.

## Run on your laptop

You need Node.js 22 or newer (FinZ uses the built-in `node:sqlite`) and [Ollama](https://ollama.com/download).

Pull the model FinZ runs here:

```bash
ollama pull gemma3:4b
```

If Ollama did not start a background service (common when systemd is not running), start it in another terminal:

```bash
ollama serve
```

Then:

```bash
npm install
npm run dev
```

Open [http://localhost:47291](http://localhost:47291). The dev server binds `0.0.0.0:47291`. The first page explains the desk. Start Gemma is a plain-language setup guide at `/guide`. Onboarding includes a currency (USD, INR, EUR, or GBP).

`gemma3:1b` was the first try. It parsed a matcha note, then invented a purchase when asked for a mood. `gemma3:4b` stays on the entries you actually logged, which is the bar. It wants a few gigabytes of RAM. If that is too tight, pull the smaller tag and point FinZ at it. `npm run dev` works in Command Prompt and Git Bash. The optional model switch does not, so set it the way your shell expects.

```bash
ollama pull gemma3:1b
```

Git Bash:

```bash
OLLAMA_MODEL=gemma3:1b npm run dev
```

Command Prompt:

```bat
set OLLAMA_MODEL=gemma3:1b
npm run dev
```

## What stays on-device

- Profile, dreams, and the ledger: `data/finz.db` (gitignored)
- Model weights: Ollama's local store
- Agent calls: Mastra talks to `http://127.0.0.1:11434`

No account. No cloud database. No paid API. A note like "$14 matcha after a bad standup" is parsed on the machine, and you can correct the amount, direction, label, and feeling before it is saved.

## Why open

FinZ is a Hacktoberfest Side Hustle: something a person would actually pay for, where the open model is the product.

Privacy. Income, expenses, dreams, and the notes attached to them live in SQLite on the laptop. The Mastra agent calls Gemma through Ollama on localhost. Spending is not pasted into a chatbot on a server you do not control.

$0 inference. After `ollama pull gemma3:4b`, every parse, money-mood reflection, and starter allocation runs on the machine. No token meter and no API key.

Swap the weights. Set `OLLAMA_MODEL` to another Gemma tag you have pulled and restart. The agent harness stays. The closed model is not load-bearing.

Works without a closed API. Mastra is the open-source agent framework. Gemma is an open-weight model. On a plane, on cafe wifi you do not trust, or on a laptop that has never held an API key, FinZ still runs.

Who would pay. A new grad who will not paste their spending into a chatbot, and still wants something that can read a messy note, talk about the dream without a lecture, and sketch a boring three-bucket split (emergency buffer, cash, broad index fund) with the "not financial advice" label in plain sight.
