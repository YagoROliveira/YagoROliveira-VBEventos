import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

const API_KEY = process.env.API_KEY ?? "dev-events-api-key";
const headers = {
  "x-api-key": API_KEY,
  "content-type": "application/json",
};

const app = await buildApp();

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

function futureIso() {
  return new Date(Date.now() + 86_400_000).toISOString();
}

async function createEvent(capacity: number) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/events",
    headers,
    payload: {
      name: `itest-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      description: "integration",
      startsAt: futureIso(),
      location: "São Paulo",
      capacity,
    },
  });
  expect(response.statusCode).toBe(201);
  return response.json() as { id: string; capacity: number; registeredCount: number };
}

async function register(eventId: string, index: number) {
  return app.inject({
    method: "POST",
    url: `/api/v1/events/${eventId}/participants`,
    headers,
    payload: {
      name: `Pessoa ${index}`,
      email: `p${index}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    },
  });
}

async function patchCapacity(eventId: string, capacity: number) {
  return app.inject({
    method: "PATCH",
    url: `/api/v1/events/${eventId}`,
    headers,
    payload: { capacity },
  });
}

async function getEvent(eventId: string) {
  const response = await app.inject({
    method: "GET",
    url: `/api/v1/events/${eventId}`,
    headers,
  });
  expect(response.statusCode).toBe(200);
  return response.json() as { id: string; capacity: number; registeredCount: number };
}

describe("capacity change concurrency", () => {
  it("rejects every concurrent attempt to drop capacity below current registrations", async () => {
    const event = await createEvent(10);
    const seeded = await Promise.all(Array.from({ length: 5 }, (_, index) => register(event.id, index)));
    expect(seeded.every((response) => response.statusCode === 201)).toBe(true);

    const responses = await Promise.all(Array.from({ length: 8 }, () => patchCapacity(event.id, 4)));

    expect(responses.every((response) => response.statusCode === 400)).toBe(true);
    expect(responses.every((response) => response.json().code === "CAPACITY_TOO_LOW")).toBe(true);

    const after = await getEvent(event.id);
    expect(after.capacity).toBe(10);
    expect(after.registeredCount).toBe(5);
  });

  it("keeps capacity >= registeredCount when several valid patches race", async () => {
    const event = await createEvent(10);
    await Promise.all(Array.from({ length: 5 }, (_, index) => register(event.id, index)));

    const targets = [6, 7, 8, 9];
    const responses = await Promise.all(targets.map((capacity) => patchCapacity(event.id, capacity)));

    expect(responses.every((response) => response.statusCode === 200)).toBe(true);

    const after = await getEvent(event.id);
    expect(targets).toContain(after.capacity);
    expect(after.registeredCount).toBe(5);
    expect(after.capacity).toBeGreaterThanOrEqual(after.registeredCount);
  });
});

describe("concurrent integration", () => {
  it("never overbooks when one seat remains and many registrations race", async () => {
    const event = await createEvent(3);
    const responses = await Promise.all(Array.from({ length: 20 }, (_, index) => register(event.id, index)));

    const created = responses.filter((response) => response.statusCode === 201);
    const full = responses.filter(
      (response) => response.statusCode === 409 && response.json().code === "EVENT_FULL",
    );

    expect(created).toHaveLength(3);
    expect(full).toHaveLength(17);

    const after = await getEvent(event.id);
    expect(after.registeredCount).toBe(3);
    expect(after.registeredCount).toBeLessThanOrEqual(after.capacity);
  });

  it("serializes a capacity cut against racing registrations", async () => {
    const event = await createEvent(5);
    await Promise.all(Array.from({ length: 4 }, (_, index) => register(event.id, index)));

    const [capacityResponse, ...registrationResponses] = await Promise.all([
      patchCapacity(event.id, 4),
      ...Array.from({ length: 12 }, (_, index) => register(event.id, index + 100)),
    ]);

    const after = await getEvent(event.id);
    expect(after.registeredCount).toBeLessThanOrEqual(after.capacity);

    if (capacityResponse.statusCode === 200) {
      expect(after.capacity).toBe(4);
      expect(after.registeredCount).toBe(4);
      expect(registrationResponses.every((response) => response.statusCode === 409)).toBe(true);
      return;
    }

    expect(capacityResponse.statusCode).toBe(400);
    expect(capacityResponse.json().code).toBe("CAPACITY_TOO_LOW");
    expect(after.capacity).toBe(5);
    expect(after.registeredCount).toBe(5);
    expect(registrationResponses.filter((response) => response.statusCode === 201)).toHaveLength(1);
  });
});
