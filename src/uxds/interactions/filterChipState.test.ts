import { describe, expect, it } from "vitest";
import { isFilterChipSelected, toggleFilterChip } from "./filterChipState";

describe("toggleFilterChip", () => {
  it("adds and removes in multi mode", () => {
    expect(toggleFilterChip([], "slots", "multi")).toEqual(["slots"]);
    expect(toggleFilterChip(["slots", "saved"], "slots", "multi")).toEqual([
      "saved",
    ]);
  });

  it("keeps at most one id in single mode", () => {
    expect(toggleFilterChip(["a"], "b", "single")).toEqual(["b"]);
    expect(toggleFilterChip(["b"], "b", "single")).toEqual([]);
  });

  it("reports selection", () => {
    expect(isFilterChipSelected(["slots"], "slots")).toBe(true);
    expect(isFilterChipSelected(["slots"], "saved")).toBe(false);
  });
});
