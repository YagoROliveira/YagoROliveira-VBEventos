import { createContext, useContext, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { excerpt, formatDateTime, occupancyLabel } from "@/lib/format";
import type { PublicEvent } from "@/lib/types";

type EventRowContextValue = { event: PublicEvent };
const EventRowContext = createContext<EventRowContextValue | null>(null);

function useEventRow() {
  const ctx = useContext(EventRowContext);
  if (!ctx) throw new Error("EventRow compound parts must be used within EventRow");
  return ctx;
}

function EventRowRoot({ event, children }: { event: PublicEvent; children: ReactNode }) {
  return (
    <EventRowContext.Provider value={{ event }}>
      <article
        className="grid gap-4 rounded-xl border bg-card px-4 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_auto] md:items-center"
        data-testid="event-row"
        data-event-name={event.name}
      >
        {children}
      </article>
    </EventRowContext.Provider>
  );
}

function Main({ children }: { children: ReactNode }) {
  return <div className="min-w-0 space-y-2">{children}</div>;
}

function Title() {
  const { event } = useEventRow();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to={`/events/${event.id}`} className="font-semibold hover:underline">
        {event.name}
      </Link>
      <StatusBadge status={event.status} />
    </div>
  );
}

function Meta() {
  const { event } = useEventRow();
  return (
    <p className="text-sm text-muted-foreground">
      {formatDateTime(event.startsAt)} · {event.location}
    </p>
  );
}

function Description() {
  const { event } = useEventRow();
  const text = excerpt(event.description, 110);
  if (!text) return null;
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

function Occupancy() {
  const { event } = useEventRow();
  return (
    <p className="text-sm text-muted-foreground">{occupancyLabel(event.registeredCount, event.capacity)}</p>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export const EventRow = Object.assign(EventRowRoot, {
  Main,
  Title,
  Meta,
  Description,
  Occupancy,
  Actions,
});
