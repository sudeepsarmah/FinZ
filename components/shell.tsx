"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

const TodayContext = createContext("On this laptop");

export function ShellDate({
  today,
  children,
}: {
  today: string;
  children: React.ReactNode;
}) {
  return <TodayContext.Provider value={today}>{children}</TodayContext.Provider>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const today = useContext(TodayContext);
  const [model, setModel] = useState<{ id: string; online: boolean } | null>(null);

  useEffect(() => {
    void fetch("/api/health", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as {
          model?: { id: string; online: boolean };
        };
        if (body.model) setModel(body.model);
      })
      .catch(() => undefined);
  }, []);

  const desk = pathname === "/" || pathname.startsWith("/dreams");
  const log = pathname.startsWith("/capture");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex w-full max-w-6xl items-end justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Vol. 01 · The paycheck zine
            </p>
            <Link href="/" className="font-serif text-5xl leading-none tracking-tight">
              FinZ
            </Link>
          </div>
          <div className="text-right">
            <span className="mb-2 inline-block size-3 bg-stamp" aria-hidden />
            <p className="font-mono text-[10px] uppercase tracking-[0.16em]" suppressHydrationWarning>
              {today}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Stays on this machine
            </p>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-6 border-t border-ink px-4 py-2 sm:px-6">
          <NavLink href="/" active={desk}>
            The desk
          </NavLink>
          <NavLink href="/capture" active={log}>
            Log a note
          </NavLink>
        </nav>
      </header>
      {model && !model.online ? (
        <div className="border-b-2 border-stamp bg-sheet">
          <p className="mx-auto w-full max-w-6xl px-4 py-2 text-sm sm:px-6">
            Gemma is offline, so the messy-note reader is napping. You can still
            type a note by hand. Start Ollama, then run{" "}
            <span className="font-mono">ollama pull {model.id}</span>.
          </p>
        </div>
      ) : null}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <footer className="border-t-2 border-ink">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>SQLite on disk · Mastra · Ollama · {model?.id ?? "Gemma"}</p>
          <p>Not a bank. Not a broker. A desk.</p>
        </div>
      </footer>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`font-mono text-[11px] uppercase tracking-[0.16em] ${
        active ? "text-stamp" : "hover:text-stamp"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
