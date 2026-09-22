import { createContext, useContext, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import type { PaginationMeta, PublicParticipant } from "@/lib/types";

type ParticipantListContextValue = {
  participants: PublicParticipant[];
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onRemove?: (id: string) => void;
};

const ParticipantListContext = createContext<ParticipantListContextValue | null>(null);

function useParticipantList() {
  const ctx = useContext(ParticipantListContext);
  if (!ctx) throw new Error("ParticipantList compound parts must be used within ParticipantList");
  return ctx;
}

function ParticipantListRoot({
  participants,
  meta,
  onPageChange,
  onRemove,
  children,
}: {
  participants: PublicParticipant[];
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onRemove?: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <ParticipantListContext.Provider value={{ participants, meta, onPageChange, onRemove }}>
      <section className="space-y-4">{children}</section>
    </ParticipantListContext.Provider>
  );
}

function Header({ children }: { children?: ReactNode }) {
  const { meta } = useParticipantList();
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">{children ?? "Participantes"}</h2>
      <p className="text-sm text-muted-foreground">{meta.total} inscritos</p>
    </div>
  );
}

function Item({ participant }: { participant: PublicParticipant }) {
  const { onRemove } = useParticipantList();
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
      <div>
        <p className="font-medium">{participant.name}</p>
        <p className="text-sm text-muted-foreground">
          {participant.email}
          {participant.phone ? ` · ${participant.phone}` : ""}
        </p>
      </div>
      {onRemove ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(participant.id)}>
          Remover
        </Button>
      ) : null}
    </li>
  );
}

function Empty() {
  const { participants } = useParticipantList();
  if (participants.length > 0) return null;
  return (
    <EmptyState>
      <EmptyState.Title>Nenhum participante</EmptyState.Title>
      <EmptyState.Description>As inscrições deste evento aparecem aqui.</EmptyState.Description>
    </EmptyState>
  );
}

function Items() {
  const { participants } = useParticipantList();
  if (participants.length === 0) return null;
  return (
    <ul className="space-y-2">
      {participants.map((participant) => (
        <Item key={participant.id} participant={participant} />
      ))}
    </ul>
  );
}

function ListPagination() {
  const { meta, onPageChange } = useParticipantList();
  return (
    <Pagination meta={meta} onPageChange={onPageChange}>
      <Pagination.Prev />
      <Pagination.Info />
      <Pagination.Next />
    </Pagination>
  );
}

export const ParticipantList = Object.assign(ParticipantListRoot, {
  Header,
  Item,
  Items,
  Empty,
  Pagination: ListPagination,
});
