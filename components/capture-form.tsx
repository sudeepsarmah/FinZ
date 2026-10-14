"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Field, fieldClass } from "@/components/field";
import { StatusBlock } from "@/components/status-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSlow } from "@/components/use-slow";
import { errorMessage } from "@/components/use-summary";
import { EMOTIONS, type Direction, type Emotion } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import type { ParsedNote } from "@/lib/types";
import { validateEntry } from "@/lib/validate";

type Phase = "compose" | "review" | "saved";

export function CaptureForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("compose");
  const [raw, setRaw] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<Direction>("out");
  const [label, setLabel] = useState("");
  const [emotion, setEmotion] = useState<Emotion | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"read" | "save" | null>(null);
  const slow = useSlow(busy === "read");
  const [saved, setSaved] = useState<ParsedNote | null>(null);

  useEffect(() => {
    void fetch("/api/profile", { cache: "no-store" }).then((response) => {
      if (response.status === 404) {
        router.replace("/onboard");
        return;
      }
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return (
      <StatusBlock
        kicker="Log a note"
        title="Finding the desk…"
        body="If you haven't introduced yourself yet, we'll send you there first."
      />
    );
  }

  function applyParse(parsed: ParsedNote) {
    setAmount(parsed.amount > 0 ? String(parsed.amount) : "");
    setDirection(parsed.direction);
    setLabel(parsed.label);
    setEmotion(parsed.emotion);
    setNote(parsed.note);
    setPhase("review");
    setError(
      parsed.amount > 0
        ? ""
        : "I couldn't find a number in that note. Add one before it hits the desk.",
    );
  }

  async function readNote() {
    const text = raw.trim();
    if (text.length < 2) {
      setError("Give me a little more than that. A number helps.");
      return;
    }
    setError("");
    setBusy("read");
    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: text }),
        signal: AbortSignal.timeout(150_000),
      });
      if (!response.ok) {
        setError(await errorMessage(response, "Gemma couldn't read that."));
        setPhase("review");
        setNote(text);
        return;
      }
      const body = (await response.json()) as { parsed: ParsedNote };
      applyParse(body.parsed);
    } catch {
      setError("Gemma stalled. Nothing left the laptop. You can still type the note by hand.");
      setPhase("review");
      setNote(text);
    } finally {
      setBusy(null);
    }
  }

  function typeItMyself() {
    setPhase("review");
    setError("");
    if (!note) setNote(raw.trim());
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      amount,
      direction,
      label,
      emotion,
      note,
      rawNote: raw.trim() || null,
    };
    const check = validateEntry(payload);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setError("");
    setBusy("save");
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setError(await errorMessage(response, "The note didn't land."));
        return;
      }
      setSaved({
        amount: check.value.amount,
        direction: check.value.direction,
        label: check.value.label,
        emotion: check.value.emotion,
        note: check.value.note,
      });
      setPhase("saved");
    } catch {
      setError("The note didn't land. It's still only on this page, not in the ledger.");
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setPhase("compose");
    setRaw("");
    setAmount("");
    setDirection("out");
    setLabel("");
    setEmotion("");
    setNote("");
    setError("");
    setSaved(null);
  }

  if (phase === "saved" && saved) {
    return (
      <section className="max-w-xl border-2 border-ink bg-sheet p-5 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">On the desk</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight">Saved on this laptop.</h1>
        <p className="mt-4 font-serif text-3xl">
          {saved.label} · {saved.direction === "out" ? "out" : "in"} · {formatMoney(Math.round(saved.amount * 100))}
        </p>
        <p className="mt-2 text-lg">{saved.note}</p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em]">
          {EMOTIONS.find((item) => item.slug === saved.emotion)?.label}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button className="h-11 px-4 text-base" onClick={reset}>
            Log another
          </Button>
          <Button variant="outline" className="h-11 border-2 px-4 text-base" render={<Link href="/" />}>
            Back to the desk
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="grid max-w-3xl gap-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Quick capture</p>
        <h1 className="mt-2 font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
          Say it messy.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-7">
          A number and a feeling. Gemma reads it here, on this machine, then you correct whatever it fumbled.
        </p>
      </div>

      {phase === "compose" || phase === "review" ? (
        <div className="grid gap-3">
          <Field
            label="The note"
            htmlFor="raw-note"
            hint="Try: $14 matcha after a bad standup, felt like a treat"
          >
            <Textarea
              id="raw-note"
              className="min-h-32 rounded-sm border-2 bg-sheet px-3 py-3 text-lg"
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void readNote();
                }
              }}
              placeholder="$14 matcha after a bad standup, felt like a treat"
            />
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="stamp"
              className="h-11 px-4 text-base"
              disabled={busy != null}
              onClick={() => void readNote()}
            >
              {busy === "read" ? "Reading it locally…" : "Read it"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 border-2 px-4 text-base"
              onClick={typeItMyself}
            >
              I&apos;ll type it
            </Button>
          </div>
          {slow ? (
            <p className="text-sm text-muted-foreground">
              Still on this machine. A small model thinks in full sentences, not a corporate spinner.
            </p>
          ) : null}
        </div>
      ) : null}

      {phase === "review" ? (
        <form onSubmit={save} className="grid gap-5 border-2 border-ink bg-sheet p-4 sm:p-6">
          <div>
            <h2 className="font-serif text-3xl">Here&apos;s the read. Change anything.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gemma heard this on your laptop. It doesn&apos;t get saved until you say so.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount" htmlFor="amount">
              <Input
                id="amount"
                className={`${fieldClass} font-mono`}
                inputMode="decimal"
                value={amount}
                onValueChange={setAmount}
                placeholder="14"
              />
            </Field>
            <div className="grid gap-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em]">Direction</p>
              <div className="flex gap-2">
                <DirectionButton pressed={direction === "out"} onClick={() => setDirection("out")}>
                  Out
                </DirectionButton>
                <DirectionButton pressed={direction === "in"} onClick={() => setDirection("in")}>
                  In
                </DirectionButton>
              </div>
            </div>
          </div>
          <Field label="Label" htmlFor="label">
            <Input id="label" className={fieldClass} value={label} onValueChange={setLabel} />
          </Field>
          <div className="grid gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em]">Feeling</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {EMOTIONS.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  aria-pressed={emotion === item.slug}
                  onClick={() => setEmotion(item.slug)}
                  className={`cursor-pointer border-2 px-3 py-2 text-left ${
                    emotion === item.slug ? "border-ink bg-ink text-paper" : "border-ink bg-paper"
                  }`}
                >
                  <span className="block font-serif text-lg leading-tight">{item.label}</span>
                  <span className={`block text-xs ${emotion === item.slug ? "text-paper/75" : "text-muted-foreground"}`}>
                    {item.blurb}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <Field label="Note" htmlFor="clean-note">
            <Textarea
              id="clean-note"
              className="min-h-20 rounded-sm border-2 bg-paper px-3 py-2 text-base"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
          {error ? (
            <p role="alert" className="text-sm text-stamp">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="h-12 px-5 text-base" disabled={busy != null}>
            {busy === "save" ? "Putting it on the desk…" : "Put it on the desk"}
          </Button>
        </form>
      ) : error ? (
        <p role="alert" className="border-2 border-stamp bg-sheet px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function DirectionButton({
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
      className={`h-12 flex-1 cursor-pointer border-2 text-base ${
        pressed ? "border-ink bg-ink text-paper" : "border-ink bg-paper"
      }`}
    >
      {children}
    </button>
  );
}
