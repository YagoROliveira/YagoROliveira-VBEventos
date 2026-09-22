import { describe, expect, it } from "vitest";
import { apiKeysMatch } from "./api-key.js";

describe("apiKeysMatch", () => {
  it("accepts the expected key", () => {
    expect(apiKeysMatch("dev-events-api-key", "dev-events-api-key")).toBe(true);
  });

  it("rejects a missing or wrong key", () => {
    expect(apiKeysMatch(undefined, "dev-events-api-key")).toBe(false);
    expect(apiKeysMatch("nope", "dev-events-api-key")).toBe(false);
  });
});
