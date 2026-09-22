import { z } from "zod";
import { isValidPhone, normalizePhone } from "../lib/phone.js";
import { paginationQuerySchema } from "./common.js";

export const createParticipantSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email("Invalid email format").max(254),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => normalizePhone(value))
    .refine((value) => value === null || isValidPhone(value), {
      message: "Invalid phone number",
    }),
});

export const listParticipantsQuerySchema = paginationQuerySchema;

export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;
