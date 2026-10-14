"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">Drawer stuck</p>
      <h1 className="mt-3 font-serif text-5xl leading-tight">The page tripped.</h1>
      <p className="mt-4 text-lg leading-7">
        Your notes are still in the SQLite file on this machine. Nothing was sent anywhere.
      </p>
      <Button className="mt-6 h-11 w-fit px-4 text-base" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
