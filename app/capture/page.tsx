import { CaptureForm } from "@/components/capture-form";
import { Shell } from "@/components/shell";

export const metadata = { title: "Log a note" };

export default function CapturePage() {
  return (
    <Shell>
      <CaptureForm />
    </Shell>
  );
}
