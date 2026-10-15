import type { Cadence } from "@/lib/catalog";
import { currencyMeta, type Currency } from "@/lib/currency";

export function formatMoney(cents: number, currency: Currency | string = "USD"): string {
  const meta = currencyMeta(currency);
  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const hasCents = absolute % 100 !== 0;
  const formatted = new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(absolute / 100);
  return negative ? `-${formatted}` : formatted;
}

export function periodWindow(cadence: Cadence, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (cadence === "monthly") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return { start, end, label: "This month" };
  }

  const monday = startOfWeek(today);
  if (cadence === "weekly") {
    const end = addDays(monday, 7);
    return { start: monday, end, label: "This week" };
  }

  const epochMonday = new Date(2024, 0, 1);
  const days = Math.round(
    (Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()) -
      Date.UTC(
        epochMonday.getFullYear(),
        epochMonday.getMonth(),
        epochMonday.getDate(),
      )) /
      86_400_000,
  );
  const start = (days / 7) % 2 === 0 ? monday : addDays(monday, -7);
  return { start, end: addDays(start, 14), label: "These two weeks" };
}

export function formatPeriodRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const last = addDays(end, -1);
  return `${formatter.format(start)} – ${formatter.format(last)}`;
}

export function inWindow(iso: string, start: Date, end: Date) {
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time < end.getTime();
}

export function fundDreams(
  surplusCents: number,
  dreams: Array<{ id: number; targetCents: number }>,
) {
  const funded = new Map<number, number>(dreams.map((dream) => [dream.id, 0]));
  let remaining = Math.max(0, Math.floor(surplusCents));
  let guard = 0;

  while (remaining > 0 && guard < 24) {
    guard += 1;
    const open = dreams.filter(
      (dream) => (funded.get(dream.id) ?? 0) < dream.targetCents,
    );
    if (open.length === 0) break;

    const base = Math.floor(remaining / open.length);
    let pennies = remaining % open.length;
    let spent = 0;

    for (const dream of open) {
      const room = dream.targetCents - (funded.get(dream.id) ?? 0);
      const want = base + (pennies > 0 ? 1 : 0);
      if (pennies > 0) pennies -= 1;
      const give = Math.min(room, want);
      if (give <= 0) continue;
      funded.set(dream.id, (funded.get(dream.id) ?? 0) + give);
      spent += give;
    }

    if (spent === 0) break;
    remaining -= spent;
  }

  return { funded, unassignedCents: remaining };
}

function startOfWeek(date: Date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}
