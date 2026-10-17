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
    body: "Open PowerShell and paste ollama pull gemma3:4b. Wait until it says success. That file stays on your computer. You can close this window after.",
  },
  {
    n: "03",
    title: "Let the website see Ollama",
    body: "FinZ is on the internet, so your browser will not talk to Ollama until you allow it. Quit Ollama from the tray. Open a new PowerShell window, paste the two lines below, and leave that window open. Then refresh this page. The navbar should say Ollama connected.",
  },
  {
    n: "04",
    title: "Use the site",
    body: "You do not install FinZ and you do not run the website from a folder. Bookmark this page, open the desk, and log a note. Only the Ollama window from step 3 stays open.",
  },
];

const faqs = [
  {
    q: "Ollama is open, but the live site still says it is offline.",
    a: "Do step 3 again. Quit Ollama, then in PowerShell set OLLAMA_ORIGINS to * and run ollama serve. Leave that window open and refresh. If the navbar says Gemma is missing, run ollama pull gemma3:4b once.",
  },
  {
    q: "Do I have to keep a terminal running?",
    a: "You do not keep a terminal open for FinZ. You do leave the PowerShell window from step 3 open, because that is Ollama allowing this website to use Gemma on your computer.",
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

      <section className="grid gap-6">
        <h2 className="font-serif text-3xl">Paste these, in order</h2>
        <div className="grid gap-3">
          <p className="leading-7">
            Step 2, once.{" "}
            <a className="underline decoration-stamp" href="https://ollama.com/download">
              Get Ollama
            </a>{" "}
            first if PowerShell says the command is not recognized. You can close this window when it finishes.
          </p>
          <pre className="overflow-x-auto border-2 border-ink bg-sheet p-4 font-mono text-sm">ollama pull gemma3:4b</pre>
        </div>
        <div className="grid gap-3">
          <p className="leading-7">
            Step 3, every time the navbar says Ollama is offline. Quit Ollama first. Leave this window open, then refresh FinZ.
          </p>
          <pre className="overflow-x-auto border-2 border-ink bg-sheet p-4 font-mono text-sm">{`$env:OLLAMA_ORIGINS='*'
ollama serve`}</pre>
        </div>
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
