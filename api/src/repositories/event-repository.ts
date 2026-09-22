import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { offsetOf } from "../lib/pagination.js";
import type { EventStatus } from "../lib/status.js";
import type { CreateEventInput, UpdateEventInput } from "../schemas/event.js";

export type EventWithCount = {
  id: number;
  name: string;
  description: string | null;
  startsAt: Date;
  location: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
  registeredCount: number;
};

export type EventSummaryCounts = {
  total: number;
  upcoming: number;
  past: number;
  full: number;
};

type DateFilters = {
  from?: Date;
  to?: Date;
};

type ListFilters = DateFilters & {
  status?: EventStatus;
  page: number;
  perPage: number;
};

function datePredicate(filters: DateFilters): Prisma.Sql {
  return Prisma.sql`
    ${filters.from ? Prisma.sql`AND e.starts_at >= ${filters.from}` : Prisma.empty}
    ${filters.to ? Prisma.sql`AND e.starts_at <= ${filters.to}` : Prisma.empty}
  `;
}

function statusPredicate(status?: EventStatus): Prisma.Sql {
  if (status === "full") {
    return Prisma.sql`AND (SELECT COUNT(*) FROM participants p WHERE p.event_id = e.id) >= e.capacity`;
  }
  if (status === "past") {
    return Prisma.sql`AND e.starts_at < NOW()`;
  }
  if (status === "upcoming") {
    return Prisma.sql`AND e.starts_at >= NOW() AND (SELECT COUNT(*) FROM participants p WHERE p.event_id = e.id) < e.capacity`;
  }
  return Prisma.empty;
}

export const eventRepository = {
  async list(filters: ListFilters): Promise<{ rows: EventWithCount[]; total: number }> {
    const where = Prisma.sql`
      WHERE 1=1
      ${datePredicate(filters)}
      ${statusPredicate(filters.status)}
    `;

    const [rows, countRows] = await Promise.all([
      prisma.$queryRaw<EventWithCount[]>`
        SELECT
          e.id,
          e.name,
          e.description,
          e.starts_at AS "startsAt",
          e.location,
          e.capacity,
          e.created_at AS "createdAt",
          e.updated_at AS "updatedAt",
          (SELECT COUNT(*)::int FROM participants p WHERE p.event_id = e.id) AS "registeredCount"
        FROM events e
        ${where}
        ORDER BY e.starts_at ASC
        LIMIT ${filters.perPage}
        OFFSET ${offsetOf(filters.page, filters.perPage)}
      `,
      prisma.$queryRaw<Array<{ total: number }>>`
        SELECT COUNT(*)::int AS total
        FROM events e
        ${where}
      `,
    ]);

    return { rows, total: countRows[0]?.total ?? 0 };
  },

  async summarize(filters: DateFilters): Promise<EventSummaryCounts> {
    const rows = await prisma.$queryRaw<EventSummaryCounts[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE e.starts_at >= NOW()
            AND (SELECT COUNT(*) FROM participants p WHERE p.event_id = e.id) < e.capacity
        )::int AS upcoming,
        COUNT(*) FILTER (WHERE e.starts_at < NOW())::int AS past,
        COUNT(*) FILTER (
          WHERE (SELECT COUNT(*) FROM participants p WHERE p.event_id = e.id) >= e.capacity
        )::int AS full
      FROM events e
      WHERE 1=1
      ${datePredicate(filters)}
    `;

    return rows[0] ?? { total: 0, upcoming: 0, past: 0, full: 0 };
  },

  async findById(id: number): Promise<EventWithCount | null> {
    const rows = await prisma.$queryRaw<EventWithCount[]>`
      SELECT
        e.id,
        e.name,
        e.description,
        e.starts_at AS "startsAt",
        e.location,
        e.capacity,
        e.created_at AS "createdAt",
        e.updated_at AS "updatedAt",
        (SELECT COUNT(*)::int FROM participants p WHERE p.event_id = e.id) AS "registeredCount"
      FROM events e
      WHERE e.id = ${id}
    `;
    return rows[0] ?? null;
  },

  create(input: CreateEventInput) {
    return prisma.event.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        startsAt: new Date(input.startsAt),
        location: input.location,
        capacity: input.capacity,
      },
    });
  },

  update(id: number, input: UpdateEventInput) {
    return prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM events WHERE id = ${id} FOR UPDATE
      `;
      if (!locked[0]) return { kind: "missing" as const };

      if (input.capacity !== undefined) {
        const registeredCount = await tx.participant.count({ where: { eventId: id } });
        if (input.capacity < registeredCount) return { kind: "too_low" as const };
      }

      await tx.event.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description ?? null } : {}),
          ...(input.startsAt !== undefined ? { startsAt: new Date(input.startsAt) } : {}),
          ...(input.location !== undefined ? { location: input.location } : {}),
          ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
        },
      });
      return { kind: "updated" as const };
    });
  },

  delete(id: number) {
    return prisma.event.delete({ where: { id } });
  },
};
