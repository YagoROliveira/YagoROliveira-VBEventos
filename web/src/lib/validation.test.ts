import { describe, expect, it } from "vitest";
import { isValidEmail, validateParticipantForm } from "./validation";

describe("validateParticipantForm", () => {
  it("rejects an invalid email format on the frontend", () => {
    const errors = validateParticipantForm({
      name: "Ana",
      email: "ana-sem-formato",
      phone: "",
    });
    expect(errors.email).toBe("Informe um e-mail válido.");
  });

  it("accepts an optional empty phone and a valid email", () => {
    const errors = validateParticipantForm({
      name: "Ana",
      email: "ana@example.com",
      phone: "",
    });
    expect(errors).toEqual({});
  });

  it("rejects a short phone when it is filled", () => {
    const errors = validateParticipantForm({
      name: "Ana",
      email: "ana@example.com",
      phone: "123",
    });
    expect(errors.phone).toBeDefined();
  });
});

describe("isValidEmail", () => {
  it("accepts a regular address", () => {
    expect(isValidEmail("ana@example.com")).toBe(true);
  });
});
