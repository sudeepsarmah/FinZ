"use client";

import { useCallback, useEffect, useState } from "react";
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
      setState({ status: "ready", data });
    } catch {
      setState({
        status: "error",
        message: "The desk drawer stuck. Your notes are still on this machine.",
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
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
        if (!cancelled) setState({ status: "ready", data });
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            message: "The desk drawer stuck. Your notes are still on this machine.",
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
