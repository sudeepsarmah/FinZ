"use client";

import { useRef, useState } from "react";
import { suggestWord } from "@/lib/completions";

export function NoteBox({
  id,
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
}) {
  const field = useRef<HTMLTextAreaElement>(null);
  const [cursor, setCursor] = useState(0);
  const suggestion = suggestWord(value, cursor);
  const ghost =
    suggestion && cursor === value.length ? suggestion.word.slice(value.length - suggestion.start) : "";

  function rememberCursor(element: HTMLTextAreaElement) {
    setCursor(element.selectionStart ?? value.length);
  }

  function accept() {
    if (!suggestion) return;
    const next = value.slice(0, suggestion.start) + suggestion.word + value.slice(cursor);
    const nextCursor = suggestion.start + suggestion.word.length;
    onChange(next);
    setCursor(nextCursor);
    requestAnimationFrame(() => field.current?.setSelectionRange(nextCursor, nextCursor));
  }

  return (
    <div className="grid gap-2">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-3 py-3 text-lg"
        >
          <span className="text-transparent">{value}</span>
          <span className="text-muted-foreground/80">{ghost}</span>
        </div>
        <textarea
          ref={field}
          id={id}
          value={value}
          placeholder={placeholder}
          className="relative min-h-32 w-full rounded-sm border-2 bg-transparent px-3 py-3 text-lg outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => {
            onChange(event.target.value);
            rememberCursor(event.target);
          }}
          onClick={(event) => rememberCursor(event.currentTarget)}
          onKeyUp={(event) => rememberCursor(event.currentTarget)}
          onKeyDown={(event) => {
            if ((event.key === "Tab" || (event.key === "ArrowRight" && cursor === value.length)) && suggestion) {
              event.preventDefault();
              accept();
              return;
            }
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
          }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {suggestion
          ? `Tab writes “${suggestion.word}”. Keep typing if you meant something else.`
          : "Try: spent 200 on groceries, or $14 matcha after a bad standup."}
      </p>
    </div>
  );
}
