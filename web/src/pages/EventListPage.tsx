import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { EventCard } from "@/components/EventCard";
import { EventRow } from "@/components/EventRow";
import { EventFilters, type EventFilterValues } from "@/components/EventFilters";
import { EventResults } from "@/components/EventResults";
import { RegisterDialog } from "@/components/RegisterDialog";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { fromDateTimeLocal } from "@/lib/format";
import type { EventViewMode, PublicEvent } from "@/lib/types";

function EventActions({ event }: { event: PublicEvent }) {
  return (
    <>
      <RegisterDialog event={event}>
        <RegisterDialog.Trigger>
          <Button data-testid="register-button" disabled={event.status === "full"}>
            Registrar
          </Button>
        </RegisterDialog.Trigger>
        <RegisterDialog.Content />
      </RegisterDialog>
      <Button asChild variant="outline">
        <Link to={`/events/${event.id}`}>Ver detalhes</Link>
      </Button>
    </>
  );
}

function filtersFromParams(searchParams: URLSearchParams): EventFilterValues {
  return {
    status: (searchParams.get("status") as EventFilterValues["status"]) ?? "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
  };
}

export function EventListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const view: EventViewMode = searchParams.get("view") === "list" ? "list" : "cards";
  const filters = filtersFromParams(searchParams);

  const query = useQuery({
    queryKey: ["events", page, filters],
    queryFn: () =>
      api.listEvents({
        page,
        perPage: 20,
        status: filters.status || undefined,
        from: filters.from ? fromDateTimeLocal(filters.from) : undefined,
        to: filters.to ? fromDateTimeLocal(filters.to) : undefined,
      }),
  });

  function writeParams(nextPage: number, nextFilters: EventFilterValues, nextView = view) {
    const params = new URLSearchParams();
    if (nextPage > 1) params.set("page", String(nextPage));
    if (nextFilters.status) params.set("status", nextFilters.status);
    if (nextFilters.from) params.set("from", nextFilters.from);
    if (nextFilters.to) params.set("to", nextFilters.to);
    if (nextView === "list") params.set("view", "list");
    setSearchParams(params);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Eventos" description="Gerencie a agenda e as vagas de cada evento.">
        <PageHeader.Copy>
          <PageHeader.Title />
          <PageHeader.Description />
        </PageHeader.Copy>
        <PageHeader.Actions>
          <Button asChild>
            <Link to="/events/new" data-testid="new-event">
              Novo evento
            </Link>
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <EventFilters values={filters} onChange={(next) => writeParams(1, next)}>
        <EventFilters.DateRange />
        <EventFilters.Status />
        <EventFilters.Reset onReset={() => writeParams(1, { status: "", from: "", to: "" })} />
      </EventFilters>

      {query.data ? (
        <EventResults
          found={query.data.meta.total}
          summary={query.data.summary}
          view={view}
          onViewChange={(nextView) => writeParams(page, filters, nextView)}
        >
          <div className="space-y-1">
            <EventResults.Count />
            <EventResults.Summary />
          </div>
          <EventResults.ViewToggle />
        </EventResults>
      ) : null}

      {query.isLoading ? <p className="text-sm text-muted-foreground">Carregando eventos...</p> : null}
      {query.isError ? <p className="text-sm text-destructive">Não foi possível carregar os eventos.</p> : null}

      {query.data?.data.length === 0 ? (
        <EmptyState>
          <EmptyState.Title>Nenhum evento encontrado</EmptyState.Title>
          <EmptyState.Description>Ajuste os filtros ou crie o primeiro evento.</EmptyState.Description>
          <EmptyState.Action>
            <Button asChild>
              <Link to="/events/new">Criar evento</Link>
            </Button>
          </EmptyState.Action>
        </EmptyState>
      ) : null}

      {query.data && view === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2" data-testid="events-grid">
          {query.data.data.map((event) => (
            <EventCard key={event.id} event={event}>
              <EventCard.Header>
                <div className="flex items-start justify-between gap-3">
                  <EventCard.Title />
                  <EventCard.Status />
                </div>
                <EventCard.Meta />
                <EventCard.Description />
              </EventCard.Header>
              <EventCard.Occupancy />
              <EventCard.Actions>
                <EventActions event={event} />
              </EventCard.Actions>
            </EventCard>
          ))}
        </div>
      ) : null}

      {query.data && view === "list" ? (
        <div className="space-y-3" data-testid="events-rows">
          {query.data.data.map((event) => (
            <EventRow key={event.id} event={event}>
              <EventRow.Main>
                <EventRow.Title />
                <EventRow.Meta />
                <EventRow.Description />
              </EventRow.Main>
              <EventRow.Occupancy />
              <EventRow.Actions>
                <EventActions event={event} />
              </EventRow.Actions>
            </EventRow>
          ))}
        </div>
      ) : null}

      {query.data ? (
        <Pagination meta={query.data.meta} onPageChange={(next) => writeParams(next, filters)}>
          <Pagination.Prev />
          <Pagination.Info />
          <Pagination.Next />
        </Pagination>
      ) : null}
    </div>
  );
}
