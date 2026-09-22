import { decodeId, encodeId } from "../lib/sqids.js";
import { duplicateParticipant, eventFull, notFound } from "../lib/errors.js";
import { paginate } from "../lib/pagination.js";
import { eventRepository } from "../repositories/event-repository.js";
import { participantRepository, type ParticipantRecord } from "../repositories/participant-repository.js";
import type { CreateParticipantInput } from "../schemas/participant.js";

export type PublicParticipant = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
};

function toPublic(row: ParticipantRecord): PublicParticipant {
  return {
    id: encodeId(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    createdAt: row.createdAt.toISOString(),
  };
}

export const participantService = {
  async list(eventPublicId: string, page: number, perPage: number) {
    const eventId = decodeId(eventPublicId);
    const event = await eventRepository.findById(eventId);
    if (!event) throw notFound("Event");

    const { rows, total } = await participantRepository.listByEvent(eventId, page, perPage);
    return paginate(rows.map(toPublic), total, page, perPage);
  },

  async register(eventPublicId: string, input: CreateParticipantInput) {
    const eventId = decodeId(eventPublicId);
    const result = await participantRepository.createInTransaction(eventId, input);

    if (result.kind === "missing") throw notFound("Event");
    if (result.kind === "full") throw eventFull();
    if (result.kind === "duplicate") throw duplicateParticipant();

    return toPublic(result.participant);
  },

  async remove(eventPublicId: string, participantPublicId: string) {
    const eventId = decodeId(eventPublicId);
    const participantId = decodeId(participantPublicId, "participantId");
    const existing = await participantRepository.findById(eventId, participantId);
    if (!existing) throw notFound("Participant");
    await participantRepository.delete(participantId);
  },
};
