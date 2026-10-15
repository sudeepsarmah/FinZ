import Link from "next/link";

export function Guide() {
  return (
    <article className="grid max-w-3xl gap-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Start here</p>
        <h1 className="mt-2 font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
          Get Gemma running, then log a note.
        </h1>
        <p className="mt-4 text-lg leading-8">
          You do not need to know what a model is. Ollama is a free app that keeps Gemma on your
          computer. FinZ talks to that app. Nothing about your money is sent to a company&apos;s chatbot.
        </p>
      </header>

      <section className="grid gap-3">
        <h2 className="font-serif text-3xl">1. Install Ollama</h2>
        <p className="leading-7">
          Go to{" "}
          <a className="underline decoration-stamp" href="https://ollama.com/download">
            ollama.com/download
          </a>{" "}
          and install the app for your computer. On Windows, open the installer and click through.
          When it finishes, Ollama sits quietly in the system tray. If the llama icon is there, it is running.
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="font-serif text-3xl">2. Download Gemma</h2>
        <p className="leading-7">
          This is a one-time download, a few gigabytes. Open Command Prompt or Git Bash and paste:
        </p>
        <pre className="overflow-x-auto border-2 border-ink bg-sheet p-4 font-mono text-sm">ollama pull gemma3:4b</pre>
        <p className="leading-7">
          Wait until it says success. If your laptop is tight on memory, use <span className="font-mono">gemma3:1b</span> instead.
          It is faster and thinner, and more likely to invent a purchase. 4B is the one FinZ is aimed at.
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="font-serif text-3xl">3. Open FinZ</h2>
        <p className="leading-7">In the FinZ folder, once:</p>
        <pre className="overflow-x-auto border-2 border-ink bg-sheet p-4 font-mono text-sm">npm install</pre>
        <p className="leading-7">Every time you want the desk:</p>
        <pre className="overflow-x-auto border-2 border-ink bg-sheet p-4 font-mono text-sm">npm run dev</pre>
        <p className="leading-7">
          Then open{" "}
          <Link href="/" className="underline decoration-stamp">
            http://localhost:47291
          </Link>
          . Leave that terminal window open while you use the site. Closing it turns the desk off.
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="font-serif text-3xl">4. Log something real</h2>
        <ol className="grid list-decimal gap-2 pl-5 leading-7">
          <li>Open the desk and tell it your name, take-home, currency, and one to three dreams.</li>
          <li>Choose Log a note.</li>
          <li>
            Type a messy line. <span className="font-mono">spe</span> offers <span className="font-mono">spent</span>.
            Press Tab to take it, or keep typing if you meant a different word.
          </li>
          <li>Click Read it. Gemma fills amount, in or out, a short label, and a feeling.</li>
          <li>Change anything it fumbled. Then put it on the desk.</li>
        </ol>
        <p className="leading-7">
          A useful first note: <span className="font-mono">spent 200 on groceries</span> or{" "}
          <span className="font-mono">$14 matcha after a bad standup, felt like a treat</span>.
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="font-serif text-3xl">If the banner says Gemma is offline</h2>
        <p className="leading-7">
          The desk still saves notes you type by hand. The reader just isn&apos;t awake. Open the Ollama
          app again, or run <span className="font-mono">ollama serve</span> in a terminal, then refresh.
          You only download the model once.
        </p>
      </section>
    </article>
  );
}
