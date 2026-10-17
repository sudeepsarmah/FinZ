import type { Emotion } from "@/lib/catalog";
import { fundDreams, formatPeriodRange, inWindow, periodWindow } from "@/lib/money";
import type { Dream, Entry, Profile, Summary } from "@/lib/types";
import { dollarsToCents, type EntryDraft, type ProfileDraft } from "@/lib/validate";

const KEY = "finz.ledger.v1";

export type Ledger = {
  profile: Profile;
  dreams: Array<Omit<Dream, "fundedCents">>;
  entries: Entry[];
};

export function loadLedger(): Ledger | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Ledger;
    if (!parsed.profile?.name || !Array.isArray(parsed.dreams)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLedger(ledger: Ledger) {
  window.localStorage.setItem(KEY, JSON.stringify(ledger));
}

export function openLedger(draft: ProfileDraft): Ledger {
  const createdAt = new Date().toISOString();
  const ledger: Ledger = {
    profile: {
      name: draft.name,
      takeHomeCents: dollarsToCents(draft.takeHome),
      cadence: draft.cadence,
      risk: draft.risk,
      currency: draft.currency,
      createdAt,
    },
    dreams: draft.dreams.map((dream, index) => ({
      id: index + 1,
      name: dream.name,
      targetCents: dollarsToCents(dream.target),
      why: dream.why,
      timeline: dream.timeline,
      createdAt,
    })),
    entries: [],
  };
  saveLedger(ledger);
  return ledger;
}

export function rememberServerSummary(summary: Summary) {
  if (loadLedger()) return;
  saveLedger({
    profile: summary.profile,
    dreams: summary.dreams.map(({ fundedCents: _funded, ...dream }) => dream),
    entries: summary.recent,
  });
}

export function addLedgerEntry(draft: EntryDraft): Entry {
  const ledger = loadLedger();
  if (!ledger) throw new Error("The desk isn't open in this browser yet.");
  const entry: Entry = {
    id: Date.now(),
    amountCents: dollarsToCents(draft.amount),
    direction: draft.direction,
    label: draft.label,
    emotion: draft.emotion,
    note: draft.note,
    rawNote: draft.rawNote,
    createdAt: new Date().toISOString(),
  };
  ledger.entries = [entry, ...ledger.entries];
  saveLedger(ledger);
  return entry;
}

export function removeLedgerEntry(id: number) {
  const ledger = loadLedger();
  if (!ledger) return;
  ledger.entries = ledger.entries.filter((entry) => entry.id !== id);
  saveLedger(ledger);
}

export function patchLedgerProfile(patch: Partial<Pick<Profile, "currency" | "cadence" | "takeHomeCents">>) {
  const ledger = loadLedger();
  if (!ledger) throw new Error("The desk isn't open in this browser yet.");
  ledger.profile = { ...ledger.profile, ...patch };
  saveLedger(ledger);
}

export function summarizeLedger(ledger: Ledger): Summary {
  const window = periodWindow(ledger.profile.cadence);
  const periodEntries = ledger.entries.filter((entry) =>
    inWindow(entry.createdAt, window.start, window.end),
  );
  const sum = (entries: Entry[], direction: "in" | "out") =>
    entries.filter((entry) => entry.direction === direction).reduce((total, entry) => total + entry.amountCents, 0);
  const cashInCents = sum(periodEntries, "in");
  const cashOutCents = sum(periodEntries, "out");
  const allIn = sum(ledger.entries, "in");
  const allOut = sum(ledger.entries, "out");
  const surplusCents = Math.max(0, allIn - allOut);
  const funding = fundDreams(
    surplusCents,
    ledger.dreams.map((dream) => ({ id: dream.id, targetCents: dream.targetCents })),
  );
  const counts = new Map<Emotion, number>();
  for (const entry of periodEntries) counts.set(entry.emotion, (counts.get(entry.emotion) ?? 0) + 1);
  return {
    profile: ledger.profile,
    period: {
      label: window.label,
      rangeLabel: formatPeriodRange(window.start, window.end),
      cashInCents,
      cashOutCents,
      leftCents: cashInCents - cashOutCents,
      paycheckLogged: periodEntries.some(
        (entry) => entry.direction === "in" && entry.label.toLowerCase() === "paycheck",
      ),
    },
    allTime: {
      cashInCents: allIn,
      cashOutCents: allOut,
      surplusCents,
      unassignedCents: funding.unassignedCents,
    },
    emotions: [...counts.entries()]
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count),
    dreams: ledger.dreams.map((dream) => ({
      ...dream,
      fundedCents: funding.funded.get(dream.id) ?? 0,
    })),
    recent: ledger.entries.slice(0, 8),
    model: { id: "gemma3:4b", ollama: "down", modelReady: false },
  };
}
