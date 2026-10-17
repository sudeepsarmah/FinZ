"use client";

import { useCallback, useEffect, useState } from "react";
import { loadLedger, rememberServerSummary, summarizeLedger } from "@/lib/local-ledger";
import type { Summary } from "@/lib/types";

export type SummaryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "needs-onboarding" }
  | { status: "ready"; data: Summary };

export function useSummary() {
  const [state, setState] = useState<SummaryState>({ status: "loading" });

  const reload = useCallback(async (mode: "hard" | "soft" = "hard") => {
    if (mode === "hard") setState({ status: "loading" });
    const local = loadLedger();
    if (local) {
      setState({ status: "ready", data: summarizeLedger(local) });
      return;
    }
    try {
      const response = await fetch("/api/summary", { cache: "no-store" });
      if (response.status === 404) {
        setState({ status: "needs-onboarding" });
        return;
      }
      if (!response.ok) {
        setState({
          status: "error",
          message: await errorMessage(response, "The desk drawer stuck."),
        });
        return;
      }
      const data = (await response.json()) as Summary;
      rememberServerSummary(data);
      setState({ status: "ready", data: loadLedger() ? summarizeLedger(loadLedger()!) : data });
    } catch {
      setState({
        status: "error",
        message: "The desk drawer stuck. Your notes are still in this browser.",
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const local = loadLedger();
      if (local) {
        if (!cancelled) setState({ status: "ready", data: summarizeLedger(local) });
        return;
      }
      try {
        const response = await fetch("/api/summary", { cache: "no-store" });
        if (cancelled) return;
        if (response.status === 404) {
          setState({ status: "needs-onboarding" });
          return;
        }
        if (!response.ok) {
          setState({
            status: "error",
            message: await errorMessage(response, "The desk drawer stuck."),
          });
          return;
        }
        const data = (await response.json()) as Summary;
        rememberServerSummary(data);
        if (!cancelled) {
          const stored = loadLedger();
          setState({ status: "ready", data: stored ? summarizeLedger(stored) : data });
        }
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            message: "The desk drawer stuck. Your notes are still in this browser.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { state, reload };
}

export async function errorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}
