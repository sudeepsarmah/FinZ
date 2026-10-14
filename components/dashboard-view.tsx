"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBlock } from "@/components/status-block";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSummary, errorMessage } from "@/components/use-summary";
import { cadenceMeta, emotionMeta } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import type { Dream, Entry } from "@/lib/types";

export function DashboardView() {
  const router = useRouter();
  const { state, reload } = useSummary();
  const [paycheckBusy, setPaycheckBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (state.status === "needs-onboarding") router.replace("/onboard");
  }, [router, state.status]);

  if (state.status === "loading" || state.status === "needs-onboarding") {
    return (
      <StatusBlock
        kicker="Opening the drawer"
        title="Pulling the ledger off this laptop…"
        body="FinZ reads a SQLite file on this machine. No account, no cloud, no waiting on someone else's server."
      />
    );
  }

  if (state.status === "error") {
    return (
      <StatusBlock
        kicker="Drawer stuck"
        title="The desk didn't open."
        body={state.message}
        action={{ label: "Try again", onClick: () => void reload("hard") }}
      />
    );
  }

  const { data } = state;
  const empty = data.recent.length === 0;
  const leftNegative = data.period.leftCents < 0;

  async function logPaycheck() {
    setActionError("");
    setPaycheckBusy(true);
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: (data.profile.takeHomeCents / 100).toFixed(2),
          direction: "in",
          label: "Paycheck",
          emotion: "survival",
          note: "Take-home, dropped in from the desk.",
        }),
      });
      if (!response.ok) {
        setActionError(await errorMessage(response, "The paycheck didn't land."));
        return;
      }
      await reload("soft");
    } catch {
      setActionError("The paycheck didn't land. The ledger is still on this machine.");
    } finally {
      setPaycheckBusy(false);
    }
  }

  async function removeEntry(id: number) {
    setActionError("");
    const response = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setActionError(await errorMessage(response, "Couldn't remove that note."));
      return;
    }
    await reload("soft");
  }

  return (
    <div className="grid gap-10">
      <section className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">
            {data.profile.name}&apos;s desk · {data.period.rangeLabel}
          </p>
          <h1 className="mt-2 font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
            {empty ? "The desk is clear." : data.period.label}
          </h1>
          <p
            className={`mt-6 font-serif text-6xl leading-none tracking-tight sm:text-7xl ${
              leftNegative ? "text-stamp" : ""
            }`}
          >
            {formatMoney(data.period.leftCents)}
          </p>
          <p className="mt-3 max-w-md text-lg leading-7">
            {empty
              ? "Nothing logged in this stretch. Your first note can be messy. A matcha, a paycheck, a regret."
              : leftNegative
                ? "You're spending ahead of what you've logged coming in. If the paycheck hasn't been written down, the sign is lying."
                : "Still on your side of the line this stretch."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            You said {formatMoney(data.profile.takeHomeCents)} lands{" "}
            {cadenceMeta(data.profile.cadence).phrase}.
          </p>
          <div className="mt-6 grid grid-cols-2 border-2 border-ink">
            <div className="border-r-2 border-ink px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em]">Cash in</p>
              <p className="mt-1 font-serif text-3xl">{formatMoney(data.period.cashInCents)}</p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em]">Cash out</p>
              <p className="mt-1 font-serif text-3xl">{formatMoney(data.period.cashOutCents)}</p>
            </div>
          </div>
          {!data.period.paycheckLogged ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                variant="stamp"
                className="h-11 px-4 text-base"
                disabled={paycheckBusy}
                onClick={() => void logPaycheck()}
              >
                {paycheckBusy ? "Writing it down…" : "Drop in this paycheck"}
              </Button>
              <Link
                href="/capture"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 border-2 px-4 text-base")}
              >
                Log a note
              </Link>
            </div>
          ) : (
            <Link
              href="/capture"
              className={cn(buttonVariants({ size: "lg" }), "mt-4 h-11 px-4 text-base")}
            >
              Log another note
            </Link>
          )}
          {actionError ? (
            <p role="alert" className="mt-3 text-sm text-stamp">
              {actionError}
            </p>
          ) : null}
        </div>

        <aside className="lg:col-span-5">
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
            <h2 className="font-serif text-3xl">Dreams</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Fueled by surplus
            </p>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {data.allTime.surplusCents === 0
              ? "Dreams fill from what's left after spending, all time. Nothing to pour yet. That's a season, not a verdict."
              : `${formatMoney(data.allTime.surplusCents)} left over so far, split across the dreams until each one is full.`}
            {data.allTime.unassignedCents > 0
              ? ` ${formatMoney(data.allTime.unassignedCents)} is still unassigned because the bars are already full.`
              : ""}
          </p>
          <ul className="mt-4 grid gap-3">
            {data.dreams.map((dream) => (
              <li key={dream.id}>
                <DreamCard dream={dream} />
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section>
        <h2 className="border-b-2 border-ink pb-2 font-serif text-3xl">The feeling mix</h2>
        {data.emotions.length === 0 ? (
          <p className="mt-4 max-w-lg text-lg leading-7">
            No feelings tagged in this stretch yet. They show up when a note does: survival,
            treat, glow-up, ick, soft launch, chaos.
          </p>
        ) : (
          <EmotionMix emotions={data.emotions} />
        )}
      </section>

      <section>
        <h2 className="border-b-2 border-ink pb-2 font-serif text-3xl">Recent notes</h2>
        {data.recent.length === 0 ? (
          <p className="mt-4 text-lg">The column is blank. Log the first one while it&apos;s still fresh.</p>
        ) : (
          <ul className="mt-2">
            {data.recent.map((entry) => (
              <EntryRow key={entry.id} entry={entry} onRemove={removeEntry} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DreamCard({ dream }: { dream: Dream }) {
  const pct = dream.targetCents <= 0 ? 0 : Math.min(100, Math.round((dream.fundedCents / dream.targetCents) * 100));
  return (
    <Link href={`/dreams/${dream.id}`} className="block border-2 border-ink bg-sheet p-4 hover:bg-white">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-2xl leading-tight">{dream.name}</h3>
        <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em]">{dream.timeline}</p>
      </div>
      <p className="mt-1 text-sm italic text-muted-foreground">{dream.why}</p>
      <div
        className="mt-4 h-3 border-2 border-ink bg-paper"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${dream.name} funded`}
      >
        <div className="h-full bg-stamp" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em]">
        {formatMoney(dream.fundedCents)} of {formatMoney(dream.targetCents)} · {pct}%
      </p>
    </Link>
  );
}

function EmotionMix({ emotions }: { emotions: Array<{ slug: Entry["emotion"]; count: number }> }) {
  const total = emotions.reduce((sum, emotion) => sum + emotion.count, 0);
  return (
    <div className="mt-4">
      <div className="flex h-4 overflow-hidden border-2 border-ink" aria-hidden>
        {emotions.map((emotion, index) => (
          <div
            key={emotion.slug}
            className={index === 0 ? "bg-stamp" : "bg-ink"}
            style={{
              width: `${(emotion.count / total) * 100}%`,
              opacity: index === 0 ? 1 : Math.max(0.28, 1 - index * 0.18),
            }}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {emotions.map((emotion) => (
          <li key={emotion.slug} className="font-mono text-[11px] uppercase tracking-[0.14em]">
            {emotionMeta(emotion.slug).label} · {emotion.count}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EntryRow({
  entry,
  onRemove,
}: {
  entry: Entry;
  onRemove: (id: number) => Promise<void>;
}) {
  const when = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(entry.createdAt));
  return (
    <li className="grid grid-cols-1 gap-2 border-b border-ink/25 py-4 sm:grid-cols-[7rem_1fr_auto] sm:items-baseline">
      <p className={`font-mono text-sm ${entry.direction === "out" ? "text-stamp" : ""}`}>
        {entry.direction === "out" ? "−" : "+"}
        {formatMoney(entry.amountCents)}
      </p>
      <div>
        <p className="font-serif text-2xl leading-tight">{entry.label}</p>
        <p className="text-sm text-muted-foreground">
          {entry.note} · {emotionMeta(entry.emotion).label} · {when}
        </p>
      </div>
      <button
        type="button"
        className="cursor-pointer text-left font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-stamp sm:text-right"
        onClick={() => void onRemove(entry.id)}
      >
        Remove
      </button>
    </li>
  );
}
