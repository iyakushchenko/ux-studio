import { describe, expect, it } from "vitest";
import { PROTO_SCREENS } from "@/projects/boots-pharmacy/screens/protoScreens";
import {
  BOOK_STEP2_AFTERNOON,
  BOOK_STEP2_EVENING,
  BOOK_STEP2_MORNING,
  chunkRows,
  formatBookStep2Heading,
} from "../bookStep2CalendarData";
import {
  BOOK_STEP2_CHILD_INDEX,
  BOOK_STEP2_REACT_SCREEN_ID,
  BOOK_STEP2_SCREEN_SELECTOR,
} from "../bookStep2Contract";

describe("bookStep2Contract", () => {
  it("matches Studio screen registry child index for Book Step 2", () => {
    const screen = PROTO_SCREENS.find((s) =>
      /book - step 2/i.test(s.label)
    );
    expect(screen?.childIndex).toBe(BOOK_STEP2_CHILD_INDEX);
    expect(BOOK_STEP2_SCREEN_SELECTOR).toContain(
      `nth-child(${BOOK_STEP2_CHILD_INDEX})`
    );
    expect(BOOK_STEP2_REACT_SCREEN_ID).toBe("book-step-2");
  });

  it("keeps CJM / retreat default slot selectable", () => {
    expect(formatBookStep2Heading("June", 24)).toBe(
      "Wednesday, 24th June 2026"
    );
    expect(BOOK_STEP2_AFTERNOON.find((s) => s.t === "16:30")?.ok).toBe(true);
    expect(BOOK_STEP2_AFTERNOON.find((s) => s.t === "15:30")?.ok).toBe(true);
    expect(BOOK_STEP2_MORNING.find((s) => s.t === "11:20")?.ok).toBe(true);
  });

  it("chunks time bands into rows of 7 (CSS grid left-aligns short tails)", () => {
    const afternoonRows = chunkRows(BOOK_STEP2_AFTERNOON, 7);
    const eveningRows = chunkRows(BOOK_STEP2_EVENING, 7);
    expect(afternoonRows.at(-1)?.length).toBeLessThan(7);
    expect(eveningRows.at(-1)?.length).toBeLessThan(7);
    // Contract: page CSS uses grid 7×65px — short rows must not pad with
    // narrower spacers under space-between (regression: right-shifted last row).
    expect(afternoonRows.at(-1)?.map((s) => s.t)).toEqual([
      "15:45",
      "16:00",
      "16:15",
      "16:30",
      "16:45",
    ]);
  });
});
