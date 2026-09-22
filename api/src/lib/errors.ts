export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(entity: string): AppError {
  return new AppError(404, "NOT_FOUND", `${entity} not found`);
}

export function eventFull(): AppError {
  return new AppError(409, "EVENT_FULL", "This event has reached its capacity");
}

export function capacityTooLow(): AppError {
  return new AppError(400, "CAPACITY_TOO_LOW", "Capacity cannot be lower than the current number of participants");
}

export function duplicateParticipant(): AppError {
  return new AppError(409, "DUPLICATE_PARTICIPANT", "This email is already registered for the event");
}

export function unauthorized(): AppError {
  return new AppError(401, "UNAUTHORIZED", "Invalid or missing API key");
}
