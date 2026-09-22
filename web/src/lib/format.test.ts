import { describe, expect, it } from "vitest";
import { occupancyLabel } from "./format";

describe("occupancyLabel", () => {
  it("shows registered seats over capacity", () => {
    expect(occupancyLabel(3, 10)).toBe("3/10 vagas");
  });
});
