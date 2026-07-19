import { describe, expect, it } from "vitest";
import {
  INDEX_PDP,
  INDEX_PLP,
  PROJECT_SCREENS,
  studioNavIndex,
  studioScreenAtTab,
  studioTabToIndex,
} from "@/projects/boots-pharmacy/screens/screens";

describe("studioTabToIndex", () => {
  it("maps display tab 1 to index 0", () => {
    expect(studioTabToIndex(1)).toBe(0);
    expect(studioScreenAtTab(1)?.childIndex).toBe(11);
  });

  it("maps PLP tab 3 to childIndex 9", () => {
    expect(studioTabToIndex(3)).toBe(2);
    expect(PROJECT_SCREENS[studioTabToIndex(3)].childIndex).toBe(9);
  });

  it("clamps out-of-range tabs", () => {
    expect(studioTabToIndex(0)).toBe(0);
    expect(studioTabToIndex(99)).toBe(PROJECT_SCREENS.length - 1);
  });
});

describe("studioNavIndex", () => {
  it("returns 0 for hub", () => {
    expect(studioNavIndex(true, 5)).toBe(0);
  });

  it("returns current + 1 for prototype screens", () => {
    expect(studioNavIndex(false, 0)).toBe(1);
    expect(studioNavIndex(false, 2)).toBe(3);
  });
});

describe("PROJECT_SCREENS", () => {
  it("has unique childIndex values", () => {
    const indices = PROJECT_SCREENS.map((s) => s.childIndex);
    expect(new Set(indices).size).toBe(indices.length);
  });

  it("exposes stable screenId deep-link keys for catalog + book flow", () => {
    const byId = Object.fromEntries(
      PROJECT_SCREENS.map((s) => [s.screenId, s.childIndex])
    );
    expect(byId["site-pilot"]).toBe(11);
    expect(byId.plp).toBe(9);
    expect(byId.pdp).toBe(8);
    expect(byId["book-step-1"]).toBe(7);
    expect(byId["book-step-2"]).toBe(4);
    expect(byId["book-step-3"]).toBe(3);
    expect(PROJECT_SCREENS[INDEX_PLP]?.screenId).toBe("plp");
    expect(PROJECT_SCREENS[INDEX_PDP]?.screenId).toBe("pdp");
  });
});
