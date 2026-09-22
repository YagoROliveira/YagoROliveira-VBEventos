import { describe, expect, it } from "vitest";
import { deriveStatus } from "./status.js";

describe("deriveStatus", () => {
  const future = new Date(Date.now() + 60_000);
  const past = new Date(Date.now() - 60_000);

  it("returns full when capacity is reached, even if the event is in the future", () => {
    expect(deriveStatus(future, 10, 10)).toBe("full");
  });

  it("returns past when the event already started and still has seats", () => {
    expect(deriveStatus(past, 2, 10)).toBe("past");
  });

  it("returns upcoming when the event is in the future and has seats", () => {
    expect(deriveStatus(future, 2, 10)).toBe("upcoming");
  });
});
