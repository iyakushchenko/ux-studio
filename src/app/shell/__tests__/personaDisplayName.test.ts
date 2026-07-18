import { describe, expect, it } from "vitest";
import { personaDisplayFirstName } from "@/app/shell/personaDisplayName";

describe("personaDisplayFirstName", () => {
  it("returns the first token of a full name", () => {
    expect(personaDisplayFirstName("Sarah Jenkins")).toBe("Sarah");
  });

  it("returns the label when it is already a single name", () => {
    expect(personaDisplayFirstName("Sarah")).toBe("Sarah");
  });
});
