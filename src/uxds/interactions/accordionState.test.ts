import { describe, expect, it } from "vitest";
import { isAccordionItemOpen, toggleAccordionValue } from "./accordionState";

describe("toggleAccordionValue", () => {
  it("opens a single item and closes the previous (single mode)", () => {
    expect(toggleAccordionValue(["a"], "b", "single")).toEqual(["b"]);
    expect(toggleAccordionValue(["b"], "b", "single")).toEqual([]);
  });

  it("toggles independently in multiple mode", () => {
    expect(toggleAccordionValue(["a"], "b", "multiple")).toEqual(["a", "b"]);
    expect(toggleAccordionValue(["a", "b"], "a", "multiple")).toEqual(["b"]);
  });

  it("reports open state", () => {
    expect(isAccordionItemOpen(["x"], "x")).toBe(true);
    expect(isAccordionItemOpen(["x"], "y")).toBe(false);
  });
});
