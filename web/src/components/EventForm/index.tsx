import { createContext, useContext, type FormEvent, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type EventFormValues = {
  name: string;
  description: string;
  startsAt: string;
  location: string;
  capacity: string;
};

type EventFormContextValue = {
  values: EventFormValues;
  onChange: (values: EventFormValues) => void;
  submitting: boolean;
};

const EventFormContext = createContext<EventFormContextValue | null>(null);

function useEventForm() {
  const ctx = useContext(EventFormContext);
  if (!ctx) throw new Error("EventForm compound parts must be used within EventForm");
  return ctx;
}

function EventFormRoot({
  values,
  onChange,
  onSubmit,
  submitting,
  children,
}: {
  values: EventFormValues;
  onChange: (values: EventFormValues) => void;
  onSubmit: () => void;
  submitting: boolean;
  children: ReactNode;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <EventFormContext.Provider value={{ values, onChange, submitting }}>
      <form className="space-y-6" onSubmit={handleSubmit} data-testid="event-form">
        {children}
      </form>
    </EventFormContext.Provider>
  );
}

function Fields() {
  const { values, onChange } = useEventForm();
  return (
    <div className="grid gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          required
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={values.description}
          onChange={(event) => onChange({ ...values, description: event.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startsAt">Data e hora</Label>
          <Input
            id="startsAt"
            type="datetime-local"
            required
            value={values.startsAt}
            onChange={(event) => onChange({ ...values, startsAt: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="capacity">Capacidade</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            required
            value={values.capacity}
            onChange={(event) => onChange({ ...values, capacity: event.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="location">Local</Label>
        <Input
          id="location"
          required
          value={values.location}
          onChange={(event) => onChange({ ...values, location: event.target.value })}
        />
      </div>
    </div>
  );
}

function Actions({ children }: { children?: ReactNode }) {
  const { submitting } = useEventForm();
  return (
    <div className="flex justify-end gap-2">
      {children ?? (
        <Button type="submit" disabled={submitting} data-testid="save-event">
          {submitting ? "Salvando..." : "Salvar evento"}
        </Button>
      )}
    </div>
  );
}

export const EventForm = Object.assign(EventFormRoot, {
  Fields,
  Actions,
});
