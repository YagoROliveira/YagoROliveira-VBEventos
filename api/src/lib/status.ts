export type EventStatus = "upcoming" | "past" | "full";

export function deriveStatus(startsAt: Date, registeredCount: number, capacity: number): EventStatus {
  if (registeredCount >= capacity) return "full";
  if (startsAt.getTime() < Date.now()) return "past";
  return "upcoming";
}
