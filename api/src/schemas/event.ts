import { z } from "zod";
import { eventStatusSchema, paginationQuerySchema } from "./common.js";

export const createEventSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  startsAt: z.string().datetime({ offset: true }),
  location: z.string().trim().min(1).max(200),
  capacity: z.number().int().min(1).max(100_000),
});

export const updateEventSchema = createEventSchema.partial();

export const listEventsQuerySchema = paginationQuerySchema.extend({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  status: eventStatusSchema.optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
