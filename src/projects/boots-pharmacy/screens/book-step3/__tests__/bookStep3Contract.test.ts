import { describe, expect, it } from "vitest";
import { computeOrderPricing } from "@/projects/boots-pharmacy/data/protoOrderPricing";
import {
  PROTO_INDEX_BOOK_STEP3,
  PROTO_SCREENS,
} from "@/projects/boots-pharmacy/screens/protoScreens";
import {
  BOOK_STEP3_CHILD_INDEX,
  BOOK_STEP3_REACT_SCREEN_ID,
  BOOK_STEP3_SCREEN_SELECTOR,
} from "../bookStep3Contract";

describe("bookStep3Contract", () => {
  it("matches Studio screen registry child index for Book Step 3", () => {
    const screen = PROTO_SCREENS.find((s) =>
      /book - step 3/i.test(s.label)
    );
    expect(screen?.childIndex).toBe(BOOK_STEP3_CHILD_INDEX);
    expect(PROTO_INDEX_BOOK_STEP3).toBe(
      PROTO_SCREENS.findIndex((s) => s.childIndex === BOOK_STEP3_CHILD_INDEX)
    );
    expect(BOOK_STEP3_SCREEN_SELECTOR).toContain(
      `nth-child(${BOOK_STEP3_CHILD_INDEX})`
    );
    expect(BOOK_STEP3_REACT_SCREEN_ID).toBe("book-step-3");
  });

  it("keeps order pricing compute for booster toggle", () => {
    const withBooster = computeOrderPricing(true);
    const without = computeOrderPricing(false);
    expect(withBooster.total).toBeGreaterThan(without.total);
    expect(withBooster.subtotal).toBe(75);
  });
});
