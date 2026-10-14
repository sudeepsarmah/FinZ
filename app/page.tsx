import { DashboardView } from "@/components/dashboard-view";
import { Shell } from "@/components/shell";

export const metadata = { title: "The desk" };

export default function HomePage() {
  return (
    <Shell>
      <DashboardView />
    </Shell>
  );
}
