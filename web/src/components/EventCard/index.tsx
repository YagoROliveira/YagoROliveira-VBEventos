import { createContext, useContext, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { CapacityMeter } from "@/components/CapacityMeter";
import { excerpt, formatDateTime } from "@/lib/format";
import type { PublicEvent } from "@/lib/types";

type EventCardContextValue = { event: PublicEvent };
const EventCardContext = createContext<EventCardContextValue | null>(null);

function useEventCard() {
  const ctx = useContext(EventCardContext);
  if (!ctx) throw new Error("EventCard compound parts must be used within EventCard");
  return ctx;
}

function EventCardRoot({ event, children }: { event: PublicEvent; children: ReactNode }) {
  return (
    <EventCardContext.Provider value={{ event }}>
      <Card className="flex h-full flex-col" data-testid="event-card" data-event-name={event.name}>
        {children}
      </Card>
    </EventCardContext.Provider>
  );
}

function Header({ children }: { children?: ReactNode }) {
  return <CardHeader className="space-y-3">{children}</CardHeader>;
}

function Title() {
  const { event } = useEventCard();
  return (
    <Link to={`/events/${event.id}`} className="text-lg font-semibold hover:underline">
      {event.name}
    </Link>
  );
}

function Meta() {
  const { event } = useEventCard();
  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      <p>{formatDateTime(event.startsAt)}</p>
      <p>{event.location}</p>
    </div>
  );
}

function Description() {
  const { event } = useEventCard();
  const text = excerpt(event.description);
  if (!text) return null;
  return <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>;
}

function Status() {
  const { event } = useEventCard();
  return <StatusBadge status={event.status} />;
}

function Occupancy() {
  const { event } = useEventCard();
  return (
    <CardContent className="space-y-3">
      <CapacityMeter registered={event.registeredCount} capacity={event.capacity} />
    </CardContent>
  );
}

function Actions({ children }: { children?: ReactNode }) {
  const { event } = useEventCard();
  return (
    <CardFooter className="mt-auto flex flex-wrap gap-2">
      {children ?? (
        <Button asChild variant="outline">
          <Link to={`/events/${event.id}`}>Ver detalhes</Link>
        </Button>
      )}
    </CardFooter>
  );
}

export const EventCard = Object.assign(EventCardRoot, {
  Header,
  Title,
  Meta,
  Description,
  Status,
  Occupancy,
  Actions,
});
