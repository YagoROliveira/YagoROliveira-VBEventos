import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EventSummary } from "@/components/EventSummary";
import { ParticipantList } from "@/components/ParticipantList";
import { ParticipantForm, type ParticipantFormValues } from "@/components/ParticipantForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { validateParticipantForm, type FieldErrors } from "@/lib/validation";

const emptyParticipant: ParticipantFormValues = { name: "", email: "", phone: "" };

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const [participant, setParticipant] = useState<ParticipantFormValues>(emptyParticipant);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  const eventQuery = useQuery({
    queryKey: ["event", id],
    enabled: Boolean(id),
    queryFn: () => api.getEvent(id!),
  });

  const participantsQuery = useQuery({
    queryKey: ["participants", id, page],
    enabled: Boolean(id),
    queryFn: () => api.listParticipants(id!, page),
  });

  const registerMutation = useMutation({
    mutationFn: () =>
      api.registerParticipant(id!, {
        name: participant.name.trim(),
        email: participant.email.trim(),
        phone: participant.phone.trim() || null,
      }),
    onSuccess: async () => {
      toast.success("Participante inscrito");
      setParticipant(emptyParticipant);
      setFieldErrors({});
      await queryClient.invalidateQueries({ queryKey: ["event", id] });
      await queryClient.invalidateQueries({ queryKey: ["participants", id] });
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.code === "DUPLICATE_PARTICIPANT") {
          setFieldErrors({ email: "Este e-mail já está inscrito neste evento." });
        }
        toast.error(
          error.code === "EVENT_FULL"
            ? "Este evento está lotado."
            : error.code === "DUPLICATE_PARTICIPANT"
              ? "Este e-mail já está inscrito neste evento."
              : error.message,
        );
        return;
      }
      toast.error("Não foi possível inscrever o participante.");
    },
  });

  const removeParticipant = useMutation({
    mutationFn: (participantId: string) => api.deleteParticipant(id!, participantId),
    onSuccess: async () => {
      toast.success("Participante removido");
      await queryClient.invalidateQueries({ queryKey: ["event", id] });
      await queryClient.invalidateQueries({ queryKey: ["participants", id] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: () => api.deleteEvent(id!),
    onSuccess: async () => {
      toast.success("Evento removido");
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/events");
    },
  });

  const event = eventQuery.data;
  const isFull = event?.status === "full";

  function submitRegistration() {
    const errors = validateParticipantForm(participant);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    registerMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader title={event?.name ?? "Evento"} description="Detalhes, ocupação e inscritos.">
        <PageHeader.Copy>
          <PageHeader.Title />
          <PageHeader.Description />
        </PageHeader.Copy>
        <PageHeader.Actions>
          <Button asChild variant="outline">
            <Link to="/events">Voltar</Link>
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {eventQuery.isLoading ? <p className="text-sm text-muted-foreground">Carregando evento...</p> : null}
      {eventQuery.isError ? <p className="text-sm text-destructive">Evento não encontrado.</p> : null}

      {event ? (
        <EventSummary event={event}>
          <EventSummary.Header />
          <EventSummary.Meta />
          <EventSummary.Occupancy />
          <EventSummary.Actions>
            <Button asChild variant="outline">
              <Link to={`/events/${event.id}/edit`}>Editar</Link>
            </Button>
            <ConfirmDialog
              title="Excluir evento"
              description="Essa ação remove o evento e todos os participantes."
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
            >
              <ConfirmDialog.Trigger>
                <Button variant="destructive">Excluir</Button>
              </ConfirmDialog.Trigger>
              <ConfirmDialog.Content>
                <ConfirmDialog.Footer
                  confirmLabel="Excluir evento"
                  confirming={deleteEvent.isPending}
                  onConfirm={() => deleteEvent.mutate()}
                />
              </ConfirmDialog.Content>
            </ConfirmDialog>
          </EventSummary.Actions>
        </EventSummary>
      ) : null}

      <ParticipantForm
        values={participant}
        errors={fieldErrors}
        onChange={(next) => {
          setParticipant(next);
          setFieldErrors({});
        }}
        onSubmit={submitRegistration}
        submitting={registerMutation.isPending}
        disabled={isFull}
      >
        <ParticipantForm.Header />
        <ParticipantForm.Fields />
        <ParticipantForm.Actions />
      </ParticipantForm>

      {participantsQuery.data ? (
        <ParticipantList
          participants={participantsQuery.data.data}
          meta={participantsQuery.data.meta}
          onPageChange={(next) => setSearchParams({ page: String(next) })}
          onRemove={(participantId) => removeParticipant.mutate(participantId)}
        >
          <ParticipantList.Header />
          <ParticipantList.Empty />
          <ParticipantList.Items />
          <ParticipantList.Pagination />
        </ParticipantList>
      ) : null}
    </div>
  );
}
