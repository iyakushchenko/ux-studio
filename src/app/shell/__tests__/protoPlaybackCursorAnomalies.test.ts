import { describe, expect, it } from "vitest";
import {
  detectCursorOrphaned,
  detectCursorStale,
  isCursorAllowedDuringPlayback,
} from "@/app/shell/protoPlaybackCursorAnomalies";

describe("protoPlaybackCursorAnomalies", () => {
  it("allows cursor while scripting or pausing", () => {
    expect(
      isCursorAllowedDuringPlayback({
        isScripting: true,
        isPausingBeforeReveal: false,
      })
    ).toBe(true);
    expect(
      isCursorAllowedDuringPlayback({
        isScripting: false,
        isPausingBeforeReveal: true,
      })
    ).toBe(true);
  });

  it("detects stale cursor after manual transport", () => {
    const anomaly = detectCursorStale({
      cursorCount: 1,
      isScripting: false,
      isOnAir: false,
      isPausingBeforeReveal: false,
      transportAction: "step-forward",
      beatId: "book-location",
    });
    expect(anomaly?.kind).toBe("cursor-stale");
    expect(anomaly?.message).toContain("step-forward");
  });

  it("ignores stale check when playback animation is busy", () => {
    expect(
      detectCursorStale({
        cursorCount: 1,
        isScripting: false,
        isOnAir: false,
        isPausingBeforeReveal: true,
      })
    ).toBeNull();
  });

  it("allows a single cursor while CJM journey mode is on (parked or mid-park)", () => {
    expect(
      detectCursorStale({
        cursorCount: 1,
        isScripting: false,
        isOnAir: false,
        isPausingBeforeReveal: false,
        journeyMode: true,
        transportAction: "step-forward",
        beatId: "book-step2-reserve",
      })
    ).toBeNull();
    expect(
      detectCursorOrphaned({
        cursorCount: 1,
        isScripting: false,
        isOnAir: false,
        isPausingBeforeReveal: false,
        journeyMode: true,
        beatId: "book-step2-reserve",
        childIndex: 3,
      })
    ).toBeNull();
  });

  it("detects orphaned cursor after beat change", () => {
    const anomaly = detectCursorOrphaned({
      cursorCount: 2,
      isScripting: false,
      isOnAir: false,
      isPausingBeforeReveal: false,
      beatId: "plp",
      childIndex: 9,
    });
    expect(anomaly?.kind).toBe("cursor-orphaned");
    expect(anomaly?.detail).toContain("cursorCount=2");
  });
});
