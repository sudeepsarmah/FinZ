import { OnboardForm } from "@/components/onboard-form";
import { Shell } from "@/components/shell";

export const metadata = { title: "Open the desk" };

export default function OnboardPage() {
  return (
    <Shell>
      <OnboardForm />
    </Shell>
  );
}
