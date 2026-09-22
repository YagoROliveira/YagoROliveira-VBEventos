import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

const app = await buildApp();

afterAll(async () => {
  await app.close();
});

describe("health endpoints", () => {
  it("returns ok on /healthz without an API key", async () => {
    const response = await app.inject({ method: "GET", url: "/healthz" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});

describe("API key", () => {
  it("rejects business routes without a key", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/events" });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects a wrong key", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/events",
      headers: { "x-api-key": "wrong-key" },
    });
    expect(response.statusCode).toBe(401);
  });
});
