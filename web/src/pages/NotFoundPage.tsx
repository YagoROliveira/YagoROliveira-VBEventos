import { Link } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <EmptyState>
      <EmptyState.Title>Página não encontrada</EmptyState.Title>
      <EmptyState.Description>A rota que você tentou abrir não existe.</EmptyState.Description>
      <EmptyState.Action>
        <Button asChild>
          <Link to="/events">Ir para eventos</Link>
        </Button>
      </EmptyState.Action>
    </EmptyState>
  );
}
