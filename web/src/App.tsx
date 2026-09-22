import { Navigate, Route, Routes } from "react-router-dom";
import { EventListPage } from "@/pages/EventListPage";
import { EventFormPage } from "@/pages/EventFormPage";
import { EventDetailPage } from "@/pages/EventDetailPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <a href="/events" className="font-semibold tracking-tight">
            VB Eventos
          </a>
          <span className="text-sm text-muted-foreground">Gestão de eventos</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<EventListPage />} />
          <Route path="/events/new" element={<EventFormPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:id/edit" element={<EventFormPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
