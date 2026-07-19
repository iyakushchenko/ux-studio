import { describe, expect, it } from "vitest";
import {
  ACCORDION_CONTENT_DURATION_S,
  ACCORDION_EASE,
  ACCORDION_PROBE_SETTLE_MS,
  accordionContentTransition,
} from "./accordionMotion";

describe("accordionMotion", () => {
  it("locks premium ease + settle floor above CSS grid duration", () => {
    expect(ACCORDION_CONTENT_DURATION_S).toBe(0.32);
    expect(ACCORDION_EASE).toEqual([0.22, 1, 0.36, 1]);
    expect(ACCORDION_PROBE_SETTLE_MS).toBeGreaterThanOrEqual(400);
    expect(accordionContentTransition).toEqual({
      duration: ACCORDION_CONTENT_DURATION_S,
      ease: ACCORDION_EASE,
    });
  });
});
