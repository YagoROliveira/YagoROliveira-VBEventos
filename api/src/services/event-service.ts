import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { capacityTooLow, notFound } from "../lib/errors.js";
import { paginate } from "../lib/pagination.js";
import { decodeId, encodeId } from "../lib/sqids.js";
import { deriveStatus } from "../lib/status.js";
import { eventRepository, type EventWithCount } from "../repositories/event-repository.js";
import type { CreateEventInput, ListEventsQuery, UpdateEventInput } from "../schemas/event.js";

export type PublicEvent = {
  id: string;
  name: string;
  description: string | null;
  startsAt: string;
  location: string;
  capacity: number;
  registeredCount: number;
  status: ReturnType<typeof deriveStatus>;
};

function toPublic(event: EventWithCount): PublicEvent {
  return {
    id: encodeId(event.id),
    name: event.name,
    description: event.description,
    startsAt: event.startsAt.toISOString(),
    location: event.location,
    capacity: event.capacity,
    registeredCount: event.registeredCount,
    status: deriveStatus(event.startsAt, event.registeredCount, event.capacity),
  };
}

export const eventService = {
  async list(query: ListEventsQuery) {
    const dateFilters = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };

    const [{ rows, total }, summary] = await Promise.all([
      eventRepository.list({
        page: query.page,
        perPage: query.perPage,
        status: query.status,
        ...dateFilters,
      }),
      eventRepository.summarize(dateFilters),
    ]);

    return {
      ...paginate(rows.map(toPublic), total, query.page, query.perPage),
      summary,
    };
  },

  async getByPublicId(publicId: string) {
    const event = await eventRepository.findById(decodeId(publicId));
    if (!event) throw notFound("Event");
    return toPublic(event);
  },

  async create(input: CreateEventInput) {
    const created = await eventRepository.create(input);
    const event = await eventRepository.findById(created.id);
    if (!event) throw notFound("Event");
    return toPublic(event);
  },

  async update(publicId: string, input: UpdateEventInput) {
    const id = decodeId(publicId);
    const existing = await eventRepository.findById(id);
    if (!existing) throw notFound("Event");

    if (input.capacity !== undefined && input.capacity < existing.registeredCount) {
      throw capacityTooLow();
    }

    try {
      await eventRepository.update(id, input);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw notFound("Event");
      }
      throw error;
    }

    const updated = await eventRepository.findById(id);
    if (!updated) throw notFound("Event");
    return toPublic(updated);
  },

  async remove(publicId: string) {
    const id = decodeId(publicId);
    const existing = await eventRepository.findById(id);
    if (!existing) throw notFound("Event");
    await eventRepository.delete(id);
  },
};
