import { describe, expect, it } from "vitest";
import { isValidPhone, normalizePhone } from "./phone.js";

describe("phone", () => {
  it("accepts common Brazilian formats", () => {
    expect(isValidPhone("(11) 98888-7777")).toBe(true);
    expect(isValidPhone("11988887777")).toBe(true);
    expect(isValidPhone("+55 11 98888-7777")).toBe(true);
  });

  it("rejects too-short numbers", () => {
    expect(isValidPhone("123")).toBe(false);
  });

  it("normalizes empty values to null", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });
});
