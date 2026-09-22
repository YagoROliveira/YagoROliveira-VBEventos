import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../lib/errors.js";
import { encodeId } from "../lib/sqids.js";

const createInTransaction = vi.fn();
const findById = vi.fn();
const listByEvent = vi.fn();
const findParticipant = vi.fn();
const deleteParticipant = vi.fn();
const findEvent = vi.fn();

vi.mock("../repositories/participant-repository.js", () => ({
  participantRepository: {
    createInTransaction: (...args: unknown[]) => createInTransaction(...args),
    findById: (...args: unknown[]) => findParticipant(...args),
    listByEvent: (...args: unknown[]) => listByEvent(...args),
    delete: (...args: unknown[]) => deleteParticipant(...args),
  },
}));

vi.mock("../repositories/event-repository.js", () => ({
  eventRepository: {
    findById: (...args: unknown[]) => findEvent(...args),
  },
}));

const { participantService } = await import("./participant-service.js");

describe("participantService.register", () => {
  const eventPublicId = encodeId(7);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects registration when the event is full", async () => {
    createInTransaction.mockResolvedValue({ kind: "full" });

    await expect(
      participantService.register(eventPublicId, { name: "Ana", email: "ana@example.com", phone: null }),
    ).rejects.toMatchObject({ code: "EVENT_FULL", statusCode: 409 } satisfies Partial<AppError>);
  });

  it("rejects a duplicated email on the same event", async () => {
    createInTransaction.mockResolvedValue({ kind: "duplicate" });

    await expect(
      participantService.register(eventPublicId, { name: "Ana", email: "ana@example.com", phone: null }),
    ).rejects.toMatchObject({ code: "DUPLICATE_PARTICIPANT", statusCode: 409 });
  });

  it("returns the public participant when registration succeeds", async () => {
    createInTransaction.mockResolvedValue({
      kind: "created",
      participant: {
        id: 3,
        name: "Ana",
        email: "ana@example.com",
        phone: "11988887777",
        createdAt: new Date("2026-01-01T12:00:00.000Z"),
      },
    });

    const result = await participantService.register(eventPublicId, {
      name: "Ana",
      email: "ana@example.com",
      phone: null,
    });

    expect(result.email).toBe("ana@example.com");
    expect(result.phone).toBe("11988887777");
    expect(result.id).toBe(encodeId(3));
    expect(result.id).not.toBe("3");
  });
});
