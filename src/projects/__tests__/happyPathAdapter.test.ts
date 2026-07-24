import { describe, expect, it } from "vitest";
import { adaptHappyPathToBeats } from "@/projects/happyPathAdapter";
import type { IaNode } from "@/projects/contentPack";

/**
 * Fixture: the real `happy-path-json` from a live X-Suite persona export
 * (larkin_emily-stone_tech-savvy-consumer_24-jul-2026.json), verified
 * 2026-07-24 — not a synthetic shape guess.
 */
const EMILY_STONE_HAPPY_PATH: IaNode[] = [
  {
    id: "0",
    label: "Homepage",
    type: "HOMEPAGE",
    note: "Let me see what new Larkin items are available.",
    children: [],
  },
  {
    id: "1",
    label: "Product Listing Page",
    type: "PLP",
    note: "Filter Larkin products to find the exact model needed.",
    children: [
      {
        id: "1_1",
        label: "Product Details Page",
        type: "PDP",
        note: "Check specs and select the extended warranty service option.",
        children: [],
      },
    ],
  },
  {
    id: "2",
    label: "Cart",
    type: "CART",
    note: "Ensure my item and extended warranty are listed correctly.",
    children: [
      {
        id: "2_1",
        label: "Checkout",
        type: "CHECKOUT",
        note: "Pay securely to complete my Larkin purchase and protect it.",
        children: [],
      },
    ],
  },
];

describe("adaptHappyPathToBeats — real X-Suite persona fixture", () => {
  it("flattens the nested tree in document order and maps mapped types", () => {
    const result = adaptHappyPathToBeats(EMILY_STONE_HAPPY_PATH, {
      HOMEPAGE: "home",
      PLP: "plp",
      PDP: "pdp",
    });
    expect(result.beats.map((b) => b.id)).toEqual([
      "home",
      "plp",
      "pdp",
      "unmapped-cart",
      "unmapped-checkout",
    ]);
    expect(result.beats.every((b) => b.kind === "tab-landing")).toBe(true);
  });

  it("flags unmapped types instead of guessing a screenId (PP-49 discipline)", () => {
    const result = adaptHappyPathToBeats(EMILY_STONE_HAPPY_PATH, {
      HOMEPAGE: "home",
      PLP: "plp",
      PDP: "pdp",
    });
    expect(result.unmapped.sort()).toEqual(["CART", "CHECKOUT"]);
  });

  it("carries persona intent copy in notes, keyed by resolved beat id", () => {
    const result = adaptHappyPathToBeats(EMILY_STONE_HAPPY_PATH, {
      PDP: "pdp",
    });
    expect(result.notes.pdp).toBe(
      "Check specs and select the extended warranty service option."
    );
  });

  it("de-dupes ids when two nodes resolve to the same mapped screenId", () => {
    const result = adaptHappyPathToBeats(EMILY_STONE_HAPPY_PATH, {
      HOMEPAGE: "plp",
      PLP: "plp",
    });
    const ids = result.beats.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("plp");
    expect(ids).toContain("plp-2");
  });
});
