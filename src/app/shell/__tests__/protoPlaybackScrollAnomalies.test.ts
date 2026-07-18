import { describe, expect, it } from "vitest";
import {
  detectScrollJump,
  detectScrollPathDeviation,
  detectScrollReversals,
  detectScrollStutter,
  detectScrollExcessiveBurst,
  detectScrollIntraScriptStack,
  shouldReportPassiveScrollAnomaly,
} from "@/app/shell/protoPlaybackScrollAnomalies";

describe("protoPlaybackScrollAnomalies", () => {
  it("detects rapid scroll direction reversals", () => {
    const now = 1000;
    const samples = [
      { t: 900, top: 0 },
      { t: 950, top: 120 },
      { t: 980, top: 40 },
      { t: 990, top: 160 },
      { t: 1000, top: 20 },
    ];
    const anomaly = detectScrollReversals(samples, now);
    expect(anomaly?.kind).toBe("scroll-reversal");
  });

  it("detects jumps outside animation", () => {
    const anomaly = detectScrollJump(0, 180, 16);
    expect(anomaly?.kind).toBe("scroll-jump");
  });

  it("skips passive scroll anomalies at journey end when transport is idle", () => {
    expect(
      shouldReportPassiveScrollAnomaly({
        isOnAir: false,
        isPausingBeforeReveal: false,
        journeyAtEnd: true,
      })
    ).toBe(false);
    expect(
      shouldReportPassiveScrollAnomaly({
        isOnAir: true,
        isPausingBeforeReveal: false,
        journeyAtEnd: true,
      })
    ).toBe(true);
  });

  it("detects stutter frame bursts", () => {
    expect(detectScrollStutter(3)?.kind).toBe("scroll-stutter");
    expect(detectScrollStutter(2)).toBeNull();
  });

  it("detects eased path deviation", () => {
    const anomaly = detectScrollPathDeviation({
      startTop: 0,
      targetTop: 400,
      duration: 800,
      startTime: 0,
      actualTop: 220,
      now: 200,
    });
    expect(anomaly?.kind).toBe("scroll-path-deviation");
  });

  it("detects stacked eased scrolls during one director script", () => {
    const anomaly = detectScrollIntraScriptStack({
      scriptLabel: "reserve-appointment",
      animationStarts: 2,
    });
    expect(anomaly?.kind).toBe("scroll-competing");
    expect(anomaly?.message).toContain("reserve-appointment");
  });

  it("allows one long follow-up eased scroll after director script ends", () => {
    expect(
      detectScrollExcessiveBurst({
        scriptLabel: "reserve-appointment",
        animationStarts: 1,
        travelPx: 1491,
        windowMs: 1400,
      })
    ).toBeNull();
  });

  it("detects excessive post-script scroll burst", () => {
    const anomaly = detectScrollExcessiveBurst({
      scriptLabel: "select-book-time",
      animationStarts: 2,
      travelPx: 120,
      windowMs: 1400,
    });
    expect(anomaly?.kind).toBe("scroll-excessive-burst");
    expect(anomaly?.message).toContain("select-book-time");
  });

  it("allows a single follow-up scroll after director script", () => {
    expect(
      detectScrollExcessiveBurst({
        scriptLabel: "select-book-time",
        animationStarts: 1,
        travelPx: 180,
        windowMs: 1400,
      })
    ).toBeNull();
  });
});
