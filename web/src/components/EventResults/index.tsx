import { createContext, useContext, type ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventSummaryCounts, EventViewMode } from "@/lib/types";

type EventResultsContextValue = {
  found: number;
  summary: EventSummaryCounts;
  view: EventViewMode;
  onViewChange: (view: EventViewMode) => void;
};

const EventResultsContext = createContext<EventResultsContextValue | null>(null);

function useEventResults() {
  const ctx = useContext(EventResultsContext);
  if (!ctx) throw new Error("EventResults compound parts must be used within EventResults");
  return ctx;
}

function EventResultsRoot({
  found,
  summary,
  view,
  onViewChange,
  children,
}: {
  found: number;
  summary: EventSummaryCounts;
  view: EventViewMode;
  onViewChange: (view: EventViewMode) => void;
  children: ReactNode;
}) {
  return (
    <EventResultsContext.Provider value={{ found, summary, view, onViewChange }}>
      <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        {children}
      </div>
    </EventResultsContext.Provider>
  );
}

function Count() {
  const { found } = useEventResults();
  return (
    <p className="text-sm font-medium" data-testid="results-count">
      {found} {found === 1 ? "evento encontrado" : "eventos encontrados"}
    </p>
  );
}

function Summary() {
  const { summary } = useEventResults();
  return (
    <p className="text-sm text-muted-foreground" data-testid="results-summary">
      {summary.full} lotados · {summary.past} já finalizados · {summary.upcoming} abertos para inscrição
    </p>
  );
}

function ViewToggle() {
  const { view, onViewChange } = useEventResults();
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
      <Button
        type="button"
        size="sm"
        variant={view === "cards" ? "default" : "ghost"}
        className={cn("h-8 px-3", view === "cards" ? "" : "text-muted-foreground")}
        data-testid="view-cards"
        onClick={() => onViewChange("cards")}
        aria-pressed={view === "cards"}
      >
        <LayoutGrid className="h-4 w-4" />
        Cards
      </Button>
      <Button
        type="button"
        size="sm"
        variant={view === "list" ? "default" : "ghost"}
        className={cn("h-8 px-3", view === "list" ? "" : "text-muted-foreground")}
        data-testid="view-list"
        onClick={() => onViewChange("list")}
        aria-pressed={view === "list"}
      >
        <List className="h-4 w-4" />
        Lista
      </Button>
    </div>
  );
}

export const EventResults = Object.assign(EventResultsRoot, {
  Count,
  Summary,
  ViewToggle,
});
