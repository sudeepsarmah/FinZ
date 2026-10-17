import Link from "next/link";

const steps = [
  {
    n: "01",
    title: "Install Ollama",
    body: "Download the app from ollama.com/download and click through the installer. When the llama icon is in the tray, Ollama is running. You do not install FinZ.",
  },
  {
    n: "02",
    title: "Download Gemma once",
    body: "Open Command Prompt and paste ollama pull gemma3:4b. Wait until it finishes. That file stays on your computer. You can close the window after.",
  },
  {
    n: "03",
    title: "Use this website",
    body: "Bookmark FinZ and open the desk in the browser. Leave Ollama in the tray. You do not start a server, and you do not keep a terminal open for the site.",
  },
  {
    n: "04",
    title: "Log a real note",
    body: "Type something like “spent 200 on groceries”. Tab can finish the word. Read it, fix anything Gemma fumbled, then save. Come back tomorrow and do it again.",
  },
];

const faqs = [
  {
    q: "Ollama is open, but the live site still says it is offline.",
    a: "The website is on the public internet, so the browser will not talk to Ollama until you allow it. Quit Ollama. In PowerShell run: $env:OLLAMA_ORIGINS='*'; ollama serve. Leave that window open, then refresh FinZ. Also run ollama pull gemma3:4b once if the navbar says Gemma is missing.",
  },
  {
    q: "Do I have to keep a terminal running?",
    a: "No. FinZ is the website. The only thing that stays running on your computer is the Ollama app, so Gemma can read a note privately.",
  },
  {
    q: "Where do my numbers live?",
    a: "On a copy you run yourself, they sit in a SQLite file on that computer. They are not sent to a chatbot company. The public site is a demo of the desk.",
  },
  {
    q: "Can I change weekly or monthly pay later?",
    a: "Yes. On the desk, change the amount or the cadence and click Update pay. It saves in this browser.",
  },
  {
    q: "Is the starter split financial advice?",
    a: "No. It is a classroom sketch of three buckets: emergency buffer, cash, and a broad index fund. No tickers, and nobody places a trade.",
  },
  {
    q: "Gemma got the note wrong.",
    a: "That's expected. Change the amount, the label, or the feeling before you save. Nothing is stored until you put it on the desk.",
  },
];

export function Guide() {
  return (
    <article className="grid max-w-3xl gap-12">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Start here</p>
        <h1 className="mt-2 font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
          Get Gemma running, then use the site.
        </h1>
        <p className="mt-4 text-lg leading-8">
          FinZ is a website. You do not install it, and you do not leave a terminal window open for
          it. The only extra app on your computer is Ollama, so a messy note can be read on your
          machine instead of being sent to someone else&apos;s chatbot.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {steps.map((step) => (
          <article key={step.n} className="border-2 border-ink bg-sheet p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-stamp">{step.n}</p>
            <h2 className="mt-2 font-serif text-2xl">{step.title}</h2>
            <p className="mt-2 text-sm leading-6">{step.body}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-3">
        <h2 className="font-serif text-3xl">The one command</h2>
        <p className="leading-7">
          After Ollama is installed, this downloads Gemma. Do it once.{" "}
          <a className="underline decoration-stamp" href="https://ollama.com/download">
            Get Ollama
          </a>{" "}
          first if the command says it is not recognized.
        </p>
        <pre className="overflow-x-auto border-2 border-ink bg-sheet p-4 font-mono text-sm">ollama pull gemma3:4b</pre>
        <p className="leading-7">
          Then{" "}
          <Link href="/onboard" className="underline decoration-stamp">
            open the desk
          </Link>
          . If the laptop is tight on memory, <span className="font-mono">gemma3:1b</span> is the
          smaller download. It is more likely to invent a purchase.
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="border-b-2 border-ink pb-2 font-serif text-3xl">Questions that come up</h2>
        <div className="grid gap-3">
          {faqs.map((item) => (
            <details key={item.q} className="border-2 border-ink bg-sheet px-4 py-3">
              <summary className="cursor-pointer font-serif text-xl">{item.q}</summary>
              <p className="mt-2 text-sm leading-6">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}
