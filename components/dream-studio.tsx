"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBlock } from "@/components/status-block";
import { Button } from "@/components/ui/button";
import { useSlow } from "@/components/use-slow";
import { errorMessage, useSummary } from "@/components/use-summary";
import { emotionMeta, riskMeta } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import type { Allocation, Reflection } from "@/lib/types";

export function DreamStudio({ id }: { id: string }) {
  const router = useRouter();
  const { state, reload } = useSummary();
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [busy, setBusy] = useState<"mood" | "sketch" | null>(null);
  const slow = useSlow(busy != null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (state.status === "needs-onboarding") router.replace("/onboard");
  }, [router, state.status]);

  if (state.status === "loading" || state.status === "needs-onboarding") {
    return (
      <StatusBlock
        kicker="Dream"
        title="Finding this one in the ledger…"
        body="The dream, the surplus behind it, and the notes that might explain the mood."
      />
    );
  }

  if (state.status === "error") {
    return (
      <StatusBlock
        kicker="Drawer stuck"
        title="Couldn't open this dream."
        body={state.message}
        action={{ label: "Try again", onClick: () => void reload("hard") }}
      />
    );
  }

  const dream = state.data.dreams.find((item) => String(item.id) === id);
  if (!dream) {
    return (
      <StatusBlock
        kicker="Missing"
        title="That dream isn't on the desk."
        body="It may have been from another session, or the link is older than the ledger."
        action={{ label: "Back to the desk", href: "/" }}
      />
    );
  }

  const pct =
    dream.targetCents <= 0
      ? 0
      : Math.min(100, Math.round((dream.fundedCents / dream.targetCents) * 100));
  const risk = riskMeta(state.data.profile.risk);
  const dreamId = dream.id;

  const ask = async (kind: "mood" | "sketch") => {
    setError("");
    setBusy(kind);
    try {
      const response = await fetch(kind === "mood" ? "/api/reflect" : "/api/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dreamId }),
        signal: AbortSignal.timeout(240_000),
      });
      if (!response.ok) {
        setError(await errorMessage(response, "Gemma stalled. Nothing left the laptop."));
        return;
      }
      const body = (await response.json()) as {
        reflection?: Reflection;
        allocation?: Allocation;
      };
      if (body.reflection) setReflection(body.reflection);
      if (body.allocation) setAllocation(body.allocation);
    } catch {
      setError("Gemma stalled. Nothing left the laptop. Try another pass.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <article className="lg:col-span-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">
          {dream.timeline}
        </p>
        <h1 className="mt-2 font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
          {dream.name}
        </h1>
        <p className="mt-4 max-w-xl text-xl italic leading-8">{dream.why}</p>
        <div
          className="mt-8 h-4 border-2 border-ink bg-paper"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`${dream.name} funded`}
        >
          <div className="h-full bg-stamp" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em]">
          {formatMoney(dream.fundedCents)} of {formatMoney(dream.targetCents)} from leftover cash · {pct}%
        </p>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          Risk comfort on the desk: {risk.label}. {risk.blurb} Take-home is{" "}
          {formatMoney(state.data.profile.takeHomeCents)}.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.16em] hover:text-stamp"
        >
          Back to the desk
        </Link>
      </article>

      <aside className="grid content-start gap-4 lg:col-span-5">
        <section className="border-2 border-ink bg-sheet p-4">
          <h2 className="font-serif text-3xl">Money mood</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A short read of recent notes against this dream. No speech. No shame.
          </p>
          <Button
            className="mt-4 h-11 px-4 text-base"
            disabled={busy != null}
            onClick={() => void ask("mood")}
          >
            {busy === "mood" ? "Reading the desk…" : "How's the money mood?"}
          </Button>
        </section>

        <section className="border-2 border-ink bg-sheet p-4">
          <h2 className="font-serif text-3xl">Starter split</h2>
          <p className="mt-2 border-2 border-stamp px-3 py-2 font-mono text-[10px] uppercase leading-5 tracking-[0.12em]">
            Not financial advice
          </p>
          <p className="mt-3 text-sm leading-6">
            An educational sketch of three buckets for money you might set aside later: emergency
            buffer, cash, and a broad index fund. No tickers. No one is placing a trade. Built from
            your dreams, timelines, and risk comfort, on this laptop.
          </p>
          <Button
            variant="outline"
            className="mt-4 h-11 border-2 px-4 text-base"
            disabled={busy != null}
            onClick={() => void ask("sketch")}
          >
            {busy === "sketch" ? "Sketching buckets…" : "Sketch a starter split"}
          </Button>
        </section>

        {slow ? (
          <p className="text-sm text-muted-foreground">
            Gemma is still thinking on this machine. No receipt leaves the laptop.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="border-2 border-stamp bg-sheet px-3 py-2 text-sm">
            {error}
          </p>
        ) : null}
      </aside>

      {reflection ? (
        <article className="border-2 border-ink bg-sheet p-5 lg:col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Money mood</p>
          <h2 className="mt-2 font-serif text-4xl leading-tight">{reflection.title}</h2>
          <p className="mt-4 text-lg leading-8">{reflection.body}</p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em]">— FinZ, on this laptop</p>
        </article>
      ) : null}

      {allocation ? (
        <section className="border-2 border-ink bg-sheet p-5 lg:col-span-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">
            Not financial advice
          </p>
          <h2 className="mt-2 font-serif text-3xl leading-tight">{allocation.headline}</h2>
          <ul className="mt-4 grid gap-3">
            <Bucket label="Emergency buffer" percent={allocation.emergencyPercent} />
            <Bucket label="Cash" percent={allocation.cashPercent} />
            <Bucket label="Broad index funds" percent={allocation.indexPercent} />
          </ul>
          <p className="mt-4 text-base leading-7">{allocation.because}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This is a classroom sketch of new money you might set aside, not a map of a brokerage
            account. Swap the weights anytime. The disclaimer stays.
          </p>
        </section>
      ) : null}

      <section className="lg:col-span-12">
        <h2 className="border-b-2 border-ink pb-2 font-serif text-3xl">Notes in the room</h2>
        {state.data.recent.length === 0 ? (
          <p className="mt-4 text-lg">
            No notes yet, so a mood read can only talk about the dream.{" "}
            <Link href="/capture" className="underline decoration-stamp">
              Log one
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-2">
            {state.data.recent.map((entry) => (
              <li key={entry.id} className="border-b border-ink/25 py-3">
                <p className="font-serif text-xl">
                  {entry.direction === "out" ? "−" : "+"}
                  {formatMoney(entry.amountCents)} {entry.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {entry.note} · {emotionMeta(entry.emotion).label}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Bucket({ label, percent }: { label: string; percent: number }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-serif text-xl">{label}</span>
        <span className="font-mono text-sm">{percent}%</span>
      </div>
      <div className="mt-1 h-3 border-2 border-ink bg-paper" aria-hidden>
        <div className="h-full bg-ink" style={{ width: `${percent}%` }} />
      </div>
    </li>
  );
}
