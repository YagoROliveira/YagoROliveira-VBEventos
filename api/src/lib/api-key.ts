import { createHash, timingSafeEqual } from "node:crypto";

export function apiKeysMatch(provided: string | string[] | undefined, expected: string): boolean {
  if (!expected || typeof provided !== "string") return false;
  const left = createHash("sha256").update(provided).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}
