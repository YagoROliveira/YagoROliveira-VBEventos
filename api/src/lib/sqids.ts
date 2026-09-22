import Sqids from "sqids";
import { config } from "./config.js";
import { AppError } from "./errors.js";

const sqids = new Sqids({
  alphabet: config.sqids.alphabet,
  minLength: config.sqids.minLength,
});

export function encodeId(id: number): string {
  return sqids.encode([id]);
}

export function decodeId(publicId: string, field = "id"): number {
  const decoded = sqids.decode(publicId);
  if (decoded.length !== 1 || encodeId(decoded[0]) !== publicId) {
    throw new AppError(400, "INVALID_ID", `Invalid ${field}`);
  }
  return decoded[0];
}
