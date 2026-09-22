import { z } from "zod";
import { DEFAULT_PAGE, DEFAULT_PER_PAGE, MAX_PER_PAGE } from "../lib/pagination.js";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  perPage: z.coerce.number().int().min(1).max(MAX_PER_PAGE).default(DEFAULT_PER_PAGE),
});

export const publicIdSchema = z.string().min(1);

export const eventStatusSchema = z.enum(["upcoming", "past", "full"]);
