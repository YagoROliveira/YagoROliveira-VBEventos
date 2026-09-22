import { Badge } from "@/components/ui/badge";
import type { EventStatus } from "@/lib/types";

const labels: Record<EventStatus, string> = {
  upcoming: "Futuro",
  past: "Passado",
  full: "Lotado",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <Badge variant={status} data-testid="status-badge" data-status={status}>
      {labels[status]}
    </Badge>
  );
}
