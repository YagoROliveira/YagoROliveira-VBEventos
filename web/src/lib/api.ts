import type { EventListResponse, EventPayload, Paginated, PublicEvent, PublicParticipant } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => ({}))) as {
    code?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new ApiError(response.status, payload.code ?? "REQUEST_ERROR", payload.message ?? "Request failed");
  }

  return payload as T;
}

export type EventListParams = {
  page?: number;
  perPage?: number;
  status?: string;
  from?: string;
  to?: string;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  listEvents(params: EventListParams) {
    return request<EventListResponse>(
      `/events${toQuery({
        page: params.page,
        perPage: params.perPage ?? 20,
        status: params.status,
        from: params.from,
        to: params.to,
      })}`,
    );
  },
  getEvent(id: string) {
    return request<PublicEvent>(`/events/${id}`);
  },
  createEvent(body: EventPayload) {
    return request<PublicEvent>("/events", { method: "POST", body: JSON.stringify(body) });
  },
  updateEvent(id: string, body: Partial<EventPayload>) {
    return request<PublicEvent>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  deleteEvent(id: string) {
    return request<void>(`/events/${id}`, { method: "DELETE" });
  },
  listParticipants(eventId: string, page = 1) {
    return request<Paginated<PublicParticipant>>(
      `/events/${eventId}/participants${toQuery({ page, perPage: 20 })}`,
    );
  },
  registerParticipant(eventId: string, body: { name: string; email: string; phone?: string | null }) {
    return request<PublicParticipant>(`/events/${eventId}/participants`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  deleteParticipant(eventId: string, participantId: string) {
    return request<void>(`/events/${eventId}/participants/${participantId}`, { method: "DELETE" });
  },
};
