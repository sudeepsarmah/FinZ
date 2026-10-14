import { StatusBlock } from "@/components/status-block";
import { Shell } from "@/components/shell";

export default function NotFound() {
  return (
    <Shell>
      <StatusBlock
        kicker="404"
        title="This page isn't on the desk."
        body="The link doesn't match a note, a dream, or a room we keep."
        action={{ label: "Back to the desk", href: "/" }}
      />
    </Shell>
  );
}
