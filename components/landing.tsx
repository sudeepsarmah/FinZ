import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const shots = [
  {
    src: "/shots/desk.webp",
    alt: "A desk showing 2784 left, 2800 in, 16 out, and two dreams",
    caption: "The desk after a paycheck and one small treat. What's left, and how far each dream got.",
  },
  {
    src: "/shots/mood.webp",
    alt: "A dream page with a short money-mood note",
    caption: "Ask for a money mood. It talks about the notes you actually logged, on this laptop.",
  },
  {
    src: "/shots/split.webp",
    alt: "A starter split of emergency buffer, cash, and a broad index fund",
    caption: "A starter split is three buckets. Not stock picks. The not-advice label stays on the page.",
  },
];

export function Landing() {
  return (
    <div className="grid gap-12">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">On this laptop</p>
        <h1 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
          A desk for the first paycheck.
        </h1>
        <p className="mt-5 text-lg leading-8">
          FinZ is where a messy note becomes a number, a feeling, and a little progress on a dream.
          The model that reads the note is Gemma, running on your computer through Ollama. Your
          spending does not get pasted into a chatbot on someone else&apos;s server.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/onboard" className={cn(buttonVariants({ size: "lg" }), "h-11 px-4 text-base")}>
            Open the desk
          </Link>
          <Link
            href="/guide"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 border-2 px-4 text-base")}
          >
            How to start Gemma
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Step n="01" title="Say it messy" body="“Spent 200 on groceries” or “$14 matcha after a bad standup.” You fix the read before it saves." />
        <Step n="02" title="See what's left" body="Cash in, cash out, and the feeling mix for this stretch. Surplus fills your dreams, smallest first." />
        <Step n="03" title="Ask, don't upload" body="A money-mood note and a three-bucket sketch. Educational. Not financial advice. Still on this machine." />
      </section>

      <section>
        <h2 className="border-b-2 border-ink pb-2 font-serif text-3xl">What a normal day looks like</h2>
        <div className="mt-6 grid gap-8">
          {shots.map((shot) => (
            <figure key={shot.src} className="grid gap-3">
              <Image
                src={shot.src}
                alt={shot.alt}
                width={1440}
                height={900}
                className="h-auto w-full border-2 border-ink"
              />
              <figcaption className="max-w-2xl text-sm leading-6 text-muted-foreground">{shot.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <article className="border-2 border-ink bg-sheet p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-stamp">{n}</p>
      <h2 className="mt-2 font-serif text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-6">{body}</p>
    </article>
  );
}
