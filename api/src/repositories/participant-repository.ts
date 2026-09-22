import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "../lib/prisma.js";
import { offsetOf } from "../lib/pagination.js";
import type { CreateParticipantInput } from "../schemas/participant.js";

export type LockedEvent = {
  id: number;
  capacity: number;
};

export type ParticipantRecord = {
  id: number;
  eventId: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
};

export const participantRepository = {
  async listByEvent(
    eventId: number,
    page: number,
    perPage: number,
  ): Promise<{ rows: ParticipantRecord[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.participant.findMany({
        where: { eventId },
        orderBy: { createdAt: "asc" },
        skip: offsetOf(page, perPage),
        take: perPage,
      }),
      prisma.participant.count({ where: { eventId } }),
    ]);
    return { rows, total };
  },

  async lockEventAndCount(eventId: number): Promise<{ event: LockedEvent | null; count: number }> {
    return prisma.$transaction(async (tx) => {
      const events = await tx.$queryRaw<LockedEvent[]>`
        SELECT id, capacity FROM events WHERE id = ${eventId} FOR UPDATE
      `;
      const count = await tx.participant.count({ where: { eventId } });
      return { event: events[0] ?? null, count };
    });
  },

  async createInTransaction(eventId: number, input: CreateParticipantInput) {
    return prisma.$transaction(async (tx) => {
      const events = await tx.$queryRaw<LockedEvent[]>`
        SELECT id, capacity FROM events WHERE id = ${eventId} FOR UPDATE
      `;
      const event = events[0];
      if (!event) return { kind: "missing" as const };

      const count = await tx.participant.count({ where: { eventId } });
      if (count >= event.capacity) return { kind: "full" as const };

      try {
        const participant = await tx.participant.create({
          data: {
            eventId,
            name: input.name,
            email: input.email.toLowerCase(),
            phone: input.phone ?? null,
          },
        });
        return { kind: "created" as const, participant, count: count + 1, capacity: event.capacity };
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
          return { kind: "duplicate" as const };
        }
        throw error;
      }
    });
  },

  findById(eventId: number, id: number) {
    return prisma.participant.findFirst({ where: { id, eventId } });
  },

  delete(id: number) {
    return prisma.participant.delete({ where: { id } });
  },
};
