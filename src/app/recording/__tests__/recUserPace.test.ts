/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import {
  REC_USER_PACE_MS,
  recUserPaceMs,
} from "@/app/recording/recUserPace";
import { readUrlModalId } from "@/app/recording/recModalDrain";

describe("REC_USER_PACE_MS (human pace code law)", () => {
  it("scroll-stop settle is ≥ 2000ms", () => {
    expect(REC_USER_PACE_MS.scrollStopSettle).toBeGreaterThanOrEqual(2000);
  });

  it("after-click / read pauses are human-like (not spam)", () => {
    expect(REC_USER_PACE_MS.afterClick).toBeGreaterThanOrEqual(800);
    expect(REC_USER_PACE_MS.afterScreenChange).toBeGreaterThanOrEqual(1000);
    expect(REC_USER_PACE_MS.beforeCta).toBeGreaterThanOrEqual(500);
  });

  it("recUserPaceMs returns named constants", () => {
    expect(recUserPaceMs("modalOpenWait")).toBe(REC_USER_PACE_MS.modalOpenWait);
  });
});

describe("readUrlModalId", () => {
  it("reads modal=choose-pharmacy from search", () => {
    expect(
      readUrlModalId(
        "?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy"
      )
    ).toBe("choose-pharmacy");
  });

  it("returns null when modal absent", () => {
    expect(readUrlModalId("?project=boots-pharmacy&screen=book-step-1")).toBe(
      null
    );
  });
});
