"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StatusBlock({
  kicker,
  title,
  body,
  action,
}: {
  kicker: string;
  title: string;
  body: string;
  action?: { label: string; onClick?: () => void; href?: string };
}) {
  return (
    <section className="max-w-xl border-2 border-ink bg-sheet px-5 py-8 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stamp">
        {kicker}
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-lg leading-7">{body}</p>
      {action?.href ? (
        <Link
          href={action.href}
          className={cn(buttonVariants({ size: "lg" }), "mt-6 h-11 px-4 text-base")}
        >
          {action.label}
        </Link>
      ) : null}
      {action?.onClick ? (
        <Button className="mt-6 h-11 px-4 text-base" size="lg" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </section>
  );
}
