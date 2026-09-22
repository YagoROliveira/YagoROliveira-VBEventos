import { createContext, useContext, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { EventStatus } from "@/lib/types";

export type EventFilterValues = {
  status: EventStatus | "";
  from: string;
  to: string;
};

type EventFiltersContextValue = {
  values: EventFilterValues;
  onChange: (values: EventFilterValues) => void;
};

const EventFiltersContext = createContext<EventFiltersContextValue | null>(null);

function useEventFilters() {
  const ctx = useContext(EventFiltersContext);
  if (!ctx) throw new Error("EventFilters compound parts must be used within EventFilters");
  return ctx;
}

function EventFiltersRoot({
  values,
  onChange,
  children,
}: {
  values: EventFilterValues;
  onChange: (values: EventFilterValues) => void;
  children: ReactNode;
}) {
  return (
    <EventFiltersContext.Provider value={{ values, onChange }}>
      <section className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-4">{children}</section>
    </EventFiltersContext.Provider>
  );
}

function DateRange() {
  const { values, onChange } = useEventFilters();
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="from">De</Label>
        <Input
          id="from"
          type="datetime-local"
          value={values.from}
          onChange={(event) => onChange({ ...values, from: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="to">Até</Label>
        <Input
          id="to"
          type="datetime-local"
          value={values.to}
          onChange={(event) => onChange({ ...values, to: event.target.value })}
        />
      </div>
    </>
  );
}

function Status() {
  const { values, onChange } = useEventFilters();
  return (
    <div className="space-y-1.5">
      <Label htmlFor="status">Status</Label>
      <select
        id="status"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={values.status}
        onChange={(event) => onChange({ ...values, status: event.target.value as EventFilterValues["status"] })}
      >
        <option value="">Todos</option>
        <option value="upcoming">Futuro</option>
        <option value="past">Passado</option>
        <option value="full">Lotado</option>
      </select>
    </div>
  );
}

function Reset({ onReset }: { onReset: () => void }) {
  useEventFilters();
  return (
    <div className="flex items-end">
      <Button type="button" variant="secondary" className="w-full" onClick={onReset}>
        Limpar
      </Button>
    </div>
  );
}

export const EventFilters = Object.assign(EventFiltersRoot, {
  DateRange,
  Status,
  Reset,
});
