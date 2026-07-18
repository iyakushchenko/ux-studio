import { describe, expect, it } from "vitest";
import {
  PROTO_SCREENS,
  protoNavIndex,
  protoScreenAtTab,
  protoTabToIndex,
} from "@/projects/boots-pharmacy/screens/protoScreens";

describe("protoTabToIndex", () => {
  it("maps display tab 1 to index 0", () => {
    expect(protoTabToIndex(1)).toBe(0);
    expect(protoScreenAtTab(1)?.childIndex).toBe(11);
  });

  it("maps PLP tab 3 to childIndex 9", () => {
    expect(protoTabToIndex(3)).toBe(2);
    expect(PROTO_SCREENS[protoTabToIndex(3)].childIndex).toBe(9);
  });

  it("clamps out-of-range tabs", () => {
    expect(protoTabToIndex(0)).toBe(0);
    expect(protoTabToIndex(99)).toBe(PROTO_SCREENS.length - 1);
  });
});

describe("protoNavIndex", () => {
  it("returns 0 for hub", () => {
    expect(protoNavIndex(true, 5)).toBe(0);
  });

  it("returns current + 1 for prototype screens", () => {
    expect(protoNavIndex(false, 0)).toBe(1);
    expect(protoNavIndex(false, 2)).toBe(3);
  });
});

describe("PROTO_SCREENS", () => {
  it("has unique childIndex values", () => {
    const indices = PROTO_SCREENS.map((s) => s.childIndex);
    expect(new Set(indices).size).toBe(indices.length);
  });
});
