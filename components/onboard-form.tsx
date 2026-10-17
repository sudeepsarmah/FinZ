"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Field, fieldClass } from "@/components/field";
import { StatusBlock } from "@/components/status-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyPicker } from "@/components/currency-picker";
import { CADENCES, RISKS, TIMELINES, type Risk, type Timeline } from "@/lib/catalog";
import type { Currency } from "@/lib/currency";
import { openLedger } from "@/lib/local-ledger";
import { validateProfile } from "@/lib/validate";

type DreamForm = {
  name: string;
  target: string;
  why: string;
  timeline: Timeline;
};

const emptyDream = (): DreamForm => ({
  name: "",
  target: "",
  why: "",
  timeline: "this year",
});

export function OnboardForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [takeHome, setTakeHome] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [cadence, setCadence] = useState<(typeof CADENCES)[number]["slug"]>("biweekly");
  const [risk, setRisk] = useState<Risk>("balanced");
  const [dreams, setDreams] = useState<DreamForm[]>([emptyDream()]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/profile", { cache: "no-store" }).then((response) => {
      if (response.ok) {
        router.replace("/");
        return;
      }
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return (
      <StatusBlock
        kicker="First paycheck"
        title="Checking if the desk is already open…"
        body="If this is your first time, the form is next. If you've already introduced yourself, we'll take you back."
      />
    );
  }

  function updateDream(index: number, patch: Partial<DreamForm>) {
    setDreams((current) =>
      current.map((dream, dreamIndex) => (dreamIndex === index ? { ...dream, ...patch } : dream)),
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const payload = {
      name,
      takeHome,
      currency,
      cadence,
      risk,
      dreams: dreams.map((dream) => ({
        name: dream.name,
        target: dream.target,
        why: dream.why,
        timeline: dream.timeline,
      })),
    };
    const check = validateProfile(payload);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setBusy(true);
    try {
      openLedger(check.value);
      void fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => undefined);
      router.push("/");
    } catch {
      setError("Couldn't open the desk in this browser.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid max-w-3xl gap-10">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">
          Before the spreadsheet
        </p>
        <h1 className="mt-2 font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
          First paycheck. Let&apos;s give it a desk.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-7">
          Name, what actually lands, and one to three dreams. The feelings come later, in the notes.
          This stays in a file on your laptop.
        </p>
      </div>

      <section className="grid gap-4">
        <SectionMark n="01" title="What do we call you?" />
        <Field label="Name" htmlFor="name" hint="A first name is enough. This isn't a credit application.">
          <Input
            id="name"
            className={fieldClass}
            value={name}
            onValueChange={setName}
            autoComplete="nickname"
            autoFocus
          />
        </Field>
      </section>

      <section className="grid gap-4">
        <SectionMark n="02" title="What actually hits the account?" />
        <div className="grid gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em]">Currency</p>
          <CurrencyPicker value={currency} onChange={setCurrency} />
        </div>
        <Field
          label="Take-home pay"
          htmlFor="take-home"
          hint="After the tax gremlins. The number you can actually spend."
        >
          <Input
            id="take-home"
            className={`${fieldClass} font-mono`}
            inputMode="decimal"
            value={takeHome}
            onValueChange={setTakeHome}
            placeholder="2400"
          />
        </Field>
        <ChoiceRow label="Cadence">
          {CADENCES.map((item) => (
            <Choice
              key={item.slug}
              pressed={cadence === item.slug}
              onClick={() => setCadence(item.slug)}
            >
              {item.label}
            </Choice>
          ))}
        </ChoiceRow>
      </section>

      <section className="grid gap-4">
        <SectionMark n="03" title="How jumpy can the long-term money be?" />
        <div className="grid gap-3 sm:grid-cols-3">
          {RISKS.map((item) => (
            <button
              key={item.slug}
              type="button"
              aria-pressed={risk === item.slug}
              onClick={() => setRisk(item.slug)}
              className={`cursor-pointer border-2 p-4 text-left ${
                risk === item.slug ? "border-ink bg-ink text-paper" : "border-ink bg-sheet"
              }`}
            >
              <span className="block font-serif text-2xl leading-tight">{item.label}</span>
              <span className={`mt-2 block text-sm leading-5 ${risk === item.slug ? "text-paper/80" : "text-muted-foreground"}`}>
                {item.blurb}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <SectionMark n="04" title="Dreams. Not goals in a blazer." />
        <p className="text-sm leading-6 text-muted-foreground">
          One is enough. Three is the max, so this doesn&apos;t become a second spreadsheet.
        </p>
        {dreams.map((dream, index) => (
          <fieldset key={index} className="grid gap-4 border-2 border-ink bg-sheet p-4">
            <legend className="px-2 font-mono text-[11px] uppercase tracking-[0.16em]">
              Dream {index + 1}
            </legend>
            <Field label="Name" htmlFor={`dream-name-${index}`}>
              <Input
                id={`dream-name-${index}`}
                className={fieldClass}
                value={dream.name}
                onValueChange={(value) => updateDream(index, { name: value })}
                placeholder="Two weeks in Japan with my sister"
              />
            </Field>
            <Field label="Target amount" htmlFor={`dream-target-${index}`}>
              <Input
                id={`dream-target-${index}`}
                className={`${fieldClass} font-mono`}
                inputMode="decimal"
                value={dream.target}
                onValueChange={(value) => updateDream(index, { target: value })}
                placeholder="4000"
              />
            </Field>
            <Field label="Why it matters" htmlFor={`dream-why-${index}`}>
              <Textarea
                id={`dream-why-${index}`}
                className="min-h-24 rounded-sm border-2 bg-sheet px-3 py-2 text-base"
                value={dream.why}
                onChange={(event) => updateDream(index, { why: event.target.value })}
                placeholder="She turns 30 and I want to be in the room, not in the group chat."
              />
            </Field>
            <ChoiceRow label="Rough timeline">
              {TIMELINES.map((item) => (
                <Choice
                  key={item.slug}
                  pressed={dream.timeline === item.slug}
                  onClick={() => updateDream(index, { timeline: item.slug })}
                >
                  {item.label}
                </Choice>
              ))}
            </ChoiceRow>
            {dreams.length > 1 ? (
              <button
                type="button"
                className="cursor-pointer justify-self-start font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-stamp"
                onClick={() => setDreams((current) => current.filter((_, dreamIndex) => dreamIndex !== index))}
              >
                Remove this dream
              </button>
            ) : null}
          </fieldset>
        ))}
        {dreams.length < 3 ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 justify-self-start border-2 px-4 text-base"
            onClick={() => setDreams((current) => [...current, emptyDream()])}
          >
            Add another dream
          </Button>
        ) : null}
      </section>

      {error ? (
        <p role="alert" className="border-2 border-stamp bg-sheet px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="h-12 px-5 text-base" size="lg" disabled={busy}>
        {busy ? "Opening the desk…" : "Open the desk"}
      </Button>
    </form>
  );
}

function SectionMark({ n, title }: { n: string; title: string }) {
  return (
    <div className="border-b-2 border-ink pb-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">{n}</p>
      <h2 className="font-serif text-3xl">{title}</h2>
    </div>
  );
}

function ChoiceRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em]">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Choice({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`cursor-pointer border-2 px-3 py-2 text-sm ${
        pressed ? "border-ink bg-ink text-paper" : "border-ink bg-sheet"
      }`}
    >
      {children}
    </button>
  );
}
