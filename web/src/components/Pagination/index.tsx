import { createContext, useContext, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/lib/types";

type PaginationContextValue = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
};

const PaginationContext = createContext<PaginationContextValue | null>(null);

function usePagination() {
  const ctx = useContext(PaginationContext);
  if (!ctx) throw new Error("Pagination compound parts must be used within Pagination");
  return ctx;
}

function PaginationRoot({
  meta,
  onPageChange,
  children,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  children: ReactNode;
}) {
  if (meta.totalPages <= 1) return null;
  return (
    <PaginationContext.Provider value={{ meta, onPageChange }}>
      <nav className="flex items-center justify-between gap-3 pt-2">{children}</nav>
    </PaginationContext.Provider>
  );
}

function Prev() {
  const { meta, onPageChange } = usePagination();
  return (
    <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
      Anterior
    </Button>
  );
}

function Next() {
  const { meta, onPageChange } = usePagination();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={meta.page >= meta.totalPages}
      onClick={() => onPageChange(meta.page + 1)}
    >
      Próxima
    </Button>
  );
}

function Info() {
  const { meta } = usePagination();
  return (
    <p className="text-sm text-muted-foreground">
      Página {meta.page} de {meta.totalPages} · {meta.total} itens
    </p>
  );
}

export const Pagination = Object.assign(PaginationRoot, {
  Prev,
  Next,
  Info,
});
