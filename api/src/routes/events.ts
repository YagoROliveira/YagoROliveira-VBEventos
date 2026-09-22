import type { FastifyInstance } from "fastify";
import { eventService } from "../services/event-service.js";
import { createEventSchema, listEventsQuerySchema, updateEventSchema } from "../schemas/event.js";

export async function eventRoutes(app: FastifyInstance) {
  app.get("/api/v1/events", async (request) => {
    const query = listEventsQuerySchema.parse(request.query);
    return eventService.list(query);
  });

  app.post("/api/v1/events", async (request, reply) => {
    const body = createEventSchema.parse(request.body);
    const event = await eventService.create(body);
    return reply.status(201).send(event);
  });

  app.get("/api/v1/events/:id", async (request) => {
    const { id } = request.params as { id: string };
    return eventService.getByPublicId(id);
  });

  app.patch("/api/v1/events/:id", async (request) => {
    const { id } = request.params as { id: string };
    const body = updateEventSchema.parse(request.body);
    return eventService.update(id, body);
  });

  app.delete("/api/v1/events/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await eventService.remove(id);
    return reply.status(204).send();
  });
}
