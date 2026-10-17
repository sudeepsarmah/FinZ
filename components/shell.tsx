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
  const [model, setModel] = useState<GemmaStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const local = await probeLocalOllama();
      if (cancelled) return;
      if (local) {
        setModel(local);
        return;
      }
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const body = (await response.json()) as { model?: GemmaStatus };
        if (body.model) setModel(body.model);
      } catch {
        if (!cancelled) setModel({ id: "gemma3:4b", ollama: "down", modelReady: false });
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 20000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const desk = pathname === "/" || pathname.startsWith("/dreams");
  const log = pathname.startsWith("/capture");
  const about = pathname.startsWith("/about");
  const guide = pathname.startsWith("/guide");

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
            <OllamaDot status={model} />
            <p className="font-mono text-[10px] uppercase tracking-[0.16em]" suppressHydrationWarning>
              {today}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Stays on this machine
            </p>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl flex-wrap gap-x-6 gap-y-2 border-t border-ink px-4 py-2 sm:px-6">
          <NavLink href="/" active={desk}>
            The desk
          </NavLink>
          <NavLink href="/capture" active={log}>
            Log a note
          </NavLink>
          <NavLink href="/about" active={about}>
            What this is
          </NavLink>
          <NavLink href="/guide" active={guide}>
            Start Gemma
          </NavLink>
        </nav>
      </header>
      {model && !model.modelReady ? (
        <div className="border-b-2 border-stamp bg-sheet">
          <p className="mx-auto w-full max-w-6xl px-4 py-2 text-sm sm:px-6">
            {model.ollama === "up"
              ? `Ollama is running, but ${model.id} isn't downloaded yet. You can still type a note by hand.`
              : "Ollama isn't reachable, so the messy-note reader is napping. You can still type a note by hand."}{" "}
            <Link href="/guide" className="underline decoration-stamp">
              Start Gemma
            </Link>
            .
          </p>
        </div>
      ) : null}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <footer className="border-t-2 border-ink">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            <a className="hover:text-stamp" href="https://github.com/sudeepsarmah/FinZ">
              GitHub
            </a>
          </p>
          <p>© {new Date().getFullYear()} Sudeepta Sarmah</p>
        </div>
      </footer>
    </div>
  );
}

type GemmaStatus = { id: string; ollama: "up" | "down"; modelReady: boolean };

function OllamaDot({ status }: { status: GemmaStatus | null }) {
  const ready = status?.modelReady === true;
  const ollamaUp = status?.ollama === "up";
  const color = !status ? "bg-muted-foreground" : ready ? "bg-emerald-800" : ollamaUp ? "bg-amber-600" : "bg-stamp";
  const label = !status
    ? "Checking Ollama"
    : ready
      ? "Ollama connected"
      : ollamaUp
        ? "Ollama on, Gemma missing"
        : "Ollama offline";
  return (
    <p className="mb-2 flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
      <span className={`inline-block size-2.5 ${color}`} aria-hidden />
      <span>{label}</span>
    </p>
  );
}

async function probeLocalOllama(): Promise<GemmaStatus | null> {
  try {
    const response = await fetch("http://127.0.0.1:11434/api/tags", {
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return { id: "gemma3:4b", ollama: "up", modelReady: false };
    const body = (await response.json()) as { models?: Array<{ name: string }> };
    const id = "gemma3:4b";
    const modelReady = (body.models ?? []).some(
      (model) => model.name === id || model.name.startsWith(`${id}:`),
    );
    return { id, ollama: "up", modelReady };
  } catch {
    return null;
  }
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
