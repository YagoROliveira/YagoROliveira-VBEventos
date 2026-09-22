import { describe, expect, it } from "vitest";
import { decodeId, encodeId } from "./sqids.js";
import { AppError } from "./errors.js";

describe("sqids", () => {
  it("encodes and decodes a sequential id", () => {
    const encoded = encodeId(1);
    expect(encoded).not.toBe("1");
    expect(encoded.length).toBeGreaterThanOrEqual(8);
    expect(decodeId(encoded)).toBe(1);
  });

  it("rejects a tampered public id", () => {
    expect(() => decodeId("not-a-valid-id")).toThrow(AppError);
  });
});
