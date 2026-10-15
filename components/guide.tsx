import Link from "next/link";

export function Guide() {
  return (
    <article className="grid max-w-3xl gap-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Start here</p>
        <h1 className="mt-2 font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
          Get Gemma running, then use the site.
        </h1>
        <p className="mt-4 text-lg leading-8">
          FinZ is a website. You do not install it, and you do not leave a terminal window open for
          it. The only extra app on your computer is Ollama. That app holds Gemma, so a messy note
          can be read on your machine instead of being sent to someone else&apos;s chatbot.
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
          Wait until it says success. You can close that window afterward. If your laptop is tight on
          memory, use <span className="font-mono">gemma3:1b</span> instead. It is faster and thinner,
          and more likely to invent a purchase. 4B is the one FinZ is aimed at.
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="font-serif text-3xl">3. Use FinZ in the browser</h2>
        <p className="leading-7">
          You are already on the site. Bookmark it and come back the same way you open any other
          page. Ollama can keep running in the tray. You do not start FinZ from a folder, and you
          do not run install commands to use the desk.
        </p>
        <p className="leading-7">
          <Link href="/onboard" className="underline decoration-stamp">
            Open the desk
          </Link>{" "}
          and tell it your name, what lands in your account, which currency you use, and one to
          three dreams.
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="font-serif text-3xl">4. Log something from your day</h2>
        <ol className="grid list-decimal gap-2 pl-5 leading-7">
          <li>Choose Log a note.</li>
          <li>
            Type a messy line. <span className="font-mono">spe</span> offers <span className="font-mono">spent</span>.
            Press Tab to take it, or keep typing if you meant a different word.
          </li>
          <li>Click Read it. Gemma fills the amount, whether money came in or went out, a short label, and a feeling.</li>
          <li>Change anything it got wrong. Then put it on the desk.</li>
          <li>Come back tomorrow and do the same. The desk keeps what you saved on this computer.</li>
        </ol>
        <p className="leading-7">
          A useful first note: <span className="font-mono">spent 200 on groceries</span> or{" "}
          <span className="font-mono">$14 matcha after a bad standup, felt like a treat</span>.
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="font-serif text-3xl">If the banner says Gemma is offline</h2>
        <p className="leading-7">
          The site is still open. Only the reader is asleep. Click the Ollama llama in the tray, or
          open Ollama from the Start menu, then refresh this page. You already downloaded the model.
          You do not install FinZ again.
        </p>
      </section>
    </article>
  );
}
