import { occupancyLabel } from "@/lib/format";

export function CapacityMeter({ registered, capacity }: { registered: number; capacity: number }) {
  const percent = capacity === 0 ? 100 : Math.min(100, Math.round((registered / capacity) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{occupancyLabel(registered, capacity)}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
