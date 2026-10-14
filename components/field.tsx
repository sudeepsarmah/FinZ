import { Label } from "@/components/ui/label";

export const fieldClass =
  "h-12 rounded-sm border-2 bg-sheet px-3 text-base shadow-none md:text-base";

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label
        htmlFor={htmlFor}
        className="font-mono text-[11px] uppercase tracking-[0.16em]"
      >
        {label}
      </Label>
      {children}
      {hint ? <p className="text-sm leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
