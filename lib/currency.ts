export const CURRENCIES = [
  { code: "USD", label: "US dollar", locale: "en-US", hint: "dollars" },
  { code: "INR", label: "Indian rupee", locale: "en-IN", hint: "rupees" },
  { code: "EUR", label: "Euro", locale: "en-IE", hint: "euros" },
  { code: "GBP", label: "British pound", locale: "en-GB", hint: "pounds" },
] as const;

export type Currency = (typeof CURRENCIES)[number]["code"];

export function asCurrency(value: unknown): Currency | null {
  const code = String(value ?? "").trim().toUpperCase();
  return CURRENCIES.some((item) => item.code === code) ? (code as Currency) : null;
}

export function currencyMeta(code: string) {
  return CURRENCIES.find((item) => item.code === code) ?? CURRENCIES[0];
}
