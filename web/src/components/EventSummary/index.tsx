import { createContext, useContext, type ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { CapacityMeter } from "@/components/CapacityMeter";
import { formatDateTime } from "@/lib/format";
import type { PublicEvent } from "@/lib/types";

type EventSummaryContextValue = { event: PublicEvent };
const EventSummaryContext = createContext<EventSummaryContextValue | null>(null);

function useEventSummary() {
  const ctx = useContext(EventSummaryContext);
  if (!ctx) throw new Error("EventSummary compound parts must be used within EventSummary");
  return ctx;
}

function EventSummaryRoot({ event, children }: { event: PublicEvent; children: ReactNode }) {
  return (
    <EventSummaryContext.Provider value={{ event }}>
      <Card>{children}</Card>
    </EventSummaryContext.Provider>
  );
}

function Header() {
  const { event } = useEventSummary();
  return (
    <CardHeader className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">{event.name}</h2>
        <StatusBadge status={event.status} />
      </div>
      {event.description ? <p className="text-sm text-muted-foreground">{event.description}</p> : null}
    </CardHeader>
  );
}

function Meta() {
  const { event } = useEventSummary();
  return (
    <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
      <p>
        <span className="text-muted-foreground">Quando: </span>
        {formatDateTime(event.startsAt)}
      </p>
      <p>
        <span className="text-muted-foreground">Onde: </span>
        {event.location}
      </p>
    </CardContent>
  );
}

function Occupancy() {
  const { event } = useEventSummary();
  return (
    <CardContent>
      <CapacityMeter registered={event.registeredCount} capacity={event.capacity} />
    </CardContent>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <CardContent className="flex flex-wrap gap-2">{children}</CardContent>;
}

export const EventSummary = Object.assign(EventSummaryRoot, {
  Header,
  Meta,
  Occupancy,
  Actions,
});
