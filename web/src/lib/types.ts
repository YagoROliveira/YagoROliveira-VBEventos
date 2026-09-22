export type EventStatus = "upcoming" | "past" | "full";

export type PublicEvent = {
  id: string;
  name: string;
  description: string | null;
  startsAt: string;
  location: string;
  capacity: number;
  registeredCount: number;
  status: EventStatus;
};

export type PublicParticipant = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
};

export type EventSummaryCounts = {
  total: number;
  upcoming: number;
  past: number;
  full: number;
};

export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type EventListResponse = Paginated<PublicEvent> & {
  summary: EventSummaryCounts;
};

export type EventViewMode = "cards" | "list";

export type EventPayload = {
  name: string;
  description?: string | null;
  startsAt: string;
  location: string;
  capacity: number;
};
