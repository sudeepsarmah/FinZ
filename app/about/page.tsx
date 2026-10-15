import { Landing } from "@/components/landing";
import { Shell } from "@/components/shell";

export const metadata = { title: "What this is" };

export default function AboutPage() {
  return (
    <Shell>
      <Landing />
    </Shell>
  );
}
