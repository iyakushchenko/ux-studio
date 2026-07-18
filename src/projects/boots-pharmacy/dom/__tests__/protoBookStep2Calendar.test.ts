import { describe, expect, it } from "vitest";
import { PROTO_RETREAT_SYNC_EVENT } from "@/app/proto/protoRetreatBridge";
import {
  BOOK_STEP2_RETREAT_DEFAULT_DATE,
  BOOK_STEP2_RETREAT_INTENT,
  formatBookStep2DateHeading,
  PROTO_BOOK_STEP2_RETREAT_DEFAULT_EVENT,
} from "@/projects/boots-pharmacy/dom/protoBookStep2Calendar";
import { BOOK_DEFAULT_DATE } from "@/projects/boots-pharmacy/playback/book";

describe("protoBookStep2Calendar", () => {
  it("exposes June 24 as the wire retreat default date", () => {
    expect(BOOK_STEP2_RETREAT_DEFAULT_DATE).toEqual({ month: "June", day: 24 });
    expect(BOOK_DEFAULT_DATE).toEqual(BOOK_STEP2_RETREAT_DEFAULT_DATE);
  });

  it("formats the Book Step 2 date heading for June 24 2026", () => {
    expect(formatBookStep2DateHeading("June", 24)).toBe(
      "Wednesday, 24th June 2026"
    );
  });

  it("routes wire React sync through the universal retreat bridge", () => {
    expect(PROTO_BOOK_STEP2_RETREAT_DEFAULT_EVENT).toBe(PROTO_RETREAT_SYNC_EVENT);
    expect(BOOK_STEP2_RETREAT_INTENT).toBe("book-step2-default-date");
  });
});
