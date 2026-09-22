import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EventForm, type EventFormValues } from "@/components/EventForm";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { fromDateTimeLocal, toDateTimeLocal } from "@/lib/format";
import type { PublicEvent } from "@/lib/types";

const emptyValues: EventFormValues = {
  name: "",
  description: "",
  startsAt: "",
  location: "",
  capacity: "20",
};

function toFormValues(event: PublicEvent): EventFormValues {
  return {
    name: event.name,
    description: event.description ?? "",
    startsAt: toDateTimeLocal(event.startsAt),
    location: event.location,
    capacity: String(event.capacity),
  };
}

export function EventFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);

  const eventQuery = useQuery({
    queryKey: ["event", id],
    enabled: isEdit,
    queryFn: () => api.getEvent(id!),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={isEdit ? "Editar evento" : "Novo evento"}
        description="Nome, data, local e capacidade de vagas."
      >
        <PageHeader.Copy>
          <PageHeader.Title />
          <PageHeader.Description />
        </PageHeader.Copy>
        <PageHeader.Actions>
          <Button asChild variant="outline">
            <Link to={id ? `/events/${id}` : "/events"}>Cancelar</Link>
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {eventQuery.isLoading ? <p className="text-sm text-muted-foreground">Carregando evento...</p> : null}
      {eventQuery.isError ? <p className="text-sm text-destructive">Evento não encontrado.</p> : null}

      {!isEdit ? <EventFormEditor eventId={undefined} initialValues={emptyValues} /> : null}
      {isEdit && eventQuery.data ? (
        <EventFormEditor key={eventQuery.data.id} eventId={id} initialValues={toFormValues(eventQuery.data)} />
      ) : null}
    </div>
  );
}

function EventFormEditor({
  eventId,
  initialValues,
}: {
  eventId: string | undefined;
  initialValues: EventFormValues;
}) {
  const isEdit = Boolean(eventId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<EventFormValues>(initialValues);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim() || null,
        startsAt: fromDateTimeLocal(values.startsAt),
        location: values.location.trim(),
        capacity: Number(values.capacity),
      };
      return isEdit ? api.updateEvent(eventId!, payload) : api.createEvent(payload);
    },
    onSuccess: async (event) => {
      toast.success(isEdit ? "Evento atualizado" : "Evento criado");
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      navigate(`/events/${event.id}`);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
        return;
      }
      toast.error("Não foi possível salvar o evento.");
    },
  });

  return (
    <EventForm values={values} onChange={setValues} onSubmit={() => mutation.mutate()} submitting={mutation.isPending}>
      <EventForm.Fields />
      <EventForm.Actions />
    </EventForm>
  );
}
