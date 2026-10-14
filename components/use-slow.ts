"use client";

import { useEffect, useState } from "react";

export function useSlow(active: boolean) {
  const [previous, setPrevious] = useState(active);
  const [slow, setSlow] = useState(false);
  if (active !== previous) {
    setPrevious(active);
    setSlow(false);
  }

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [active]);

  return active && slow;
}
