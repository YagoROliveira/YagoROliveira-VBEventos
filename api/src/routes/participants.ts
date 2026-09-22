import type { FastifyInstance } from "fastify";
import { participantService } from "../services/participant-service.js";
import { createParticipantSchema, listParticipantsQuerySchema } from "../schemas/participant.js";

export async function participantRoutes(app: FastifyInstance) {
  app.get("/api/v1/events/:id/participants", async (request) => {
    const { id } = request.params as { id: string };
    const query = listParticipantsQuerySchema.parse(request.query);
    return participantService.list(id, query.page, query.perPage);
  });

  app.post("/api/v1/events/:id/participants", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = createParticipantSchema.parse(request.body);
    const participant = await participantService.register(id, body);
    return reply.status(201).send(participant);
  });

  app.delete("/api/v1/events/:id/participants/:participantId", async (request, reply) => {
    const { id, participantId } = request.params as { id: string; participantId: string };
    await participantService.remove(id, participantId);
    return reply.status(204).send();
  });
}
