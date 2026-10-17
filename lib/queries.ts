import type { Emotion } from "@/lib/catalog";
import { asCurrency, type Currency } from "@/lib/currency";
import { asCadence, asEmotion, asRisk, asTimeline } from "@/lib/validate";
import { getDb, withTransaction } from "@/lib/db";
import { fundDreams, formatPeriodRange, inWindow, periodWindow } from "@/lib/money";
import { readModelStatus } from "@/lib/model";
import type { Entry, Profile, Summary } from "@/lib/types";
import type { ProfileDraft, EntryDraft } from "@/lib/validate";
import { dollarsToCents } from "@/lib/validate";

export function getProfile(): Profile | null {
  const row = getDb().prepare("SELECT * FROM profile WHERE id = 1").get();
  if (!row) return null;
  const cadence = asCadence(row.cadence);
  const risk = asRisk(row.risk);
  if (!cadence || !risk) return null;
  return {
    name: String(row.name),
    takeHomeCents: Number(row.take_home_cents),
    cadence,
    risk,
    currency: asCurrency(row.currency) ?? "USD",
    createdAt: String(row.created_at),
  };
}

export function createProfile(draft: ProfileDraft) {
  if (getProfile()) {
    throw new Error("The desk is already open.");
  }
  const createdAt = new Date().toISOString();
  withTransaction((db) => {
    db.prepare(
      `INSERT INTO profile (id, name, take_home_cents, cadence, risk, currency, created_at)
       VALUES (1, ?, ?, ?, ?, ?, ?)`,
    ).run(
      draft.name,
      dollarsToCents(draft.takeHome),
      draft.cadence,
      draft.risk,
      draft.currency,
      createdAt,
    );
    const insertDream = db.prepare(
      `INSERT INTO dreams (name, target_cents, why, timeline, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    );
    for (const dream of draft.dreams) {
      insertDream.run(
        dream.name,
        dollarsToCents(dream.target),
        dream.why,
        dream.timeline,
        createdAt,
      );
    }
  });
}

export function updateCurrency(currency: Currency) {
  const result = getDb().prepare("UPDATE profile SET currency = ? WHERE id = 1").run(currency);
  if (result.changes === 0) throw new Error("The desk isn't open yet.");
}

export function updatePaycheck(takeHomeCents: number, cadence: Profile["cadence"]) {
  const result = getDb()
    .prepare("UPDATE profile SET take_home_cents = ?, cadence = ? WHERE id = 1")
    .run(takeHomeCents, cadence);
  if (result.changes === 0) throw new Error("The desk isn't open yet.");
}

export function paycheckEditsOpen(dayOfMonth: number) {
  return dayOfMonth >= 1 && dayOfMonth <= 5;
}

export function listDreamRows() {
  return getDb()
    .prepare("SELECT * FROM dreams ORDER BY id ASC")
    .all()
    .map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      targetCents: Number(row.target_cents),
      why: String(row.why),
      timeline: asTimeline(row.timeline) ?? "someday, but real",
      createdAt: String(row.created_at),
    }));
}

export function listEntries(): Entry[] {
  return getDb()
    .prepare("SELECT * FROM entries ORDER BY created_at DESC, id DESC")
    .all()
    .map(mapEntry)
    .filter((entry): entry is Entry => entry != null);
}

export function insertEntry(draft: EntryDraft): Entry {
  const createdAt = new Date().toISOString();
  const result = getDb()
    .prepare(
      `INSERT INTO entries (amount_cents, direction, label, emotion, note, raw_note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      dollarsToCents(draft.amount),
      draft.direction,
      draft.label,
      draft.emotion,
      draft.note,
      draft.rawNote,
      createdAt,
    );
  const row = getDb()
    .prepare("SELECT * FROM entries WHERE id = ?")
    .get(Number(result.lastInsertRowid));
  const entry = row ? mapEntry(row) : null;
  if (!entry) throw new Error("The note saved and then vanished. Try it again.");
  return entry;
}

export function deleteEntry(id: number) {
  const result = getDb().prepare("DELETE FROM entries WHERE id = ?").run(id);
  return result.changes > 0;
}

export async function buildSummary(): Promise<Summary | null> {
  const profile = getProfile();
  if (!profile) return null;

  const dreams = listDreamRows();
  const entries = listEntries();
  const window = periodWindow(profile.cadence);
  const periodEntries = entries.filter((entry) =>
    inWindow(entry.createdAt, window.start, window.end),
  );

  const cashInCents = sum(periodEntries, "in");
  const cashOutCents = sum(periodEntries, "out");
  const allIn = sum(entries, "in");
  const allOut = sum(entries, "out");
  const surplusCents = Math.max(0, allIn - allOut);
  const funding = fundDreams(
    surplusCents,
    dreams.map((dream) => ({ id: dream.id, targetCents: dream.targetCents })),
  );

  const counts = new Map<Emotion, number>();
  for (const entry of periodEntries) {
    counts.set(entry.emotion, (counts.get(entry.emotion) ?? 0) + 1);
  }

  const model = await readModelStatus();

  return {
    profile,
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
    dreams: dreams.map((dream) => ({
      ...dream,
      fundedCents: funding.funded.get(dream.id) ?? 0,
    })),
    recent: entries.slice(0, 8),
    model,
  };
}

export function dreamContext(dreamId: number) {
  const profile = getProfile();
  if (!profile) return null;
  const dream = listDreamRows().find((item) => item.id === dreamId);
  if (!dream) return null;
  const entries = listEntries();
  return { profile, dream, entries: entries.slice(0, 8) };
}

function sum(entries: Entry[], direction: "in" | "out") {
  return entries
    .filter((entry) => entry.direction === direction)
    .reduce((total, entry) => total + entry.amountCents, 0);
}

function mapEntry(row: Record<string, unknown>): Entry | null {
  const emotion = asEmotion(row.emotion);
  const direction = row.direction === "in" || row.direction === "out" ? row.direction : null;
  if (!emotion || !direction) return null;
  return {
    id: Number(row.id),
    amountCents: Number(row.amount_cents),
    direction,
    label: String(row.label),
    emotion,
    note: String(row.note),
    rawNote: row.raw_note == null ? null : String(row.raw_note),
    createdAt: String(row.created_at),
  };
}
