"use client";

import { CURRENCIES, type Currency } from "@/lib/currency";

export function CurrencyPicker({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (currency: Currency) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CURRENCIES.map((item) => (
        <button
          key={item.code}
          type="button"
          aria-pressed={value === item.code}
          onClick={() => onChange(item.code)}
          className={`cursor-pointer border-2 px-3 py-2 text-left ${
            value === item.code ? "border-ink bg-ink text-paper" : "border-ink bg-sheet"
          }`}
        >
          <span className="block font-mono text-sm">{item.code}</span>
          <span className={`block text-xs ${value === item.code ? "text-paper/75" : "text-muted-foreground"}`}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
