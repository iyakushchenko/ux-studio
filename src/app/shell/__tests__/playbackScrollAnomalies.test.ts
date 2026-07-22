import { describe, expect, it } from "vitest";
import {
  detectScrollJump,
  detectScrollPathDeviation,
  detectScrollReversals,
  detectScrollStutter,
  detectScrollExcessiveBurst,
  detectScrollIntraScriptStack,
  shouldReportPassiveScrollAnomaly,
} from "@/app/shell/playbackScrollAnomalies";

describe("playbackScrollAnomalies", () => {
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

  it("skips passive scroll anomalies during scenario prelude (thinking/typing)", () => {
    expect(
      shouldReportPassiveScrollAnomaly({
        isOnAir: true,
        isPausingBeforeReveal: true,
        journeyAtEnd: false,
      })
    ).toBe(false);
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
      actualTop: 80,
      now: 200,
    });
    expect(anomaly?.kind).toBe("scroll-path-deviation");
  });

  it("skips early-frame path deviation (book-step3-camera prove flake)", () => {
    // Prove FAIL: progress≈0.03 expected≈115 actual≈78 → 37px vs old 36px threshold.
    // Reconstruct: easeOutCubic(0.03)≈0.087 → travel≈115/0.087≈1320.
    const duration = 1000;
    const now = 30; // progress 0.03 < MIN 0.12
    expect(
      detectScrollPathDeviation({
        startTop: 0,
        targetTop: 1320,
        duration,
        startTime: 0,
        actualTop: 78,
        now,
      })
    ).toBeNull();
  });

  it("ignores a transient 52px compositor offset on a short camera move", () => {
    const duration = 500;
    const now = 80;
    const expected = 400 * (1 - Math.pow(1 - now / duration, 3));
    expect(
      detectScrollPathDeviation({
        startTop: 0,
        targetTop: 400,
        duration,
        startTime: 0,
        actualTop: expected - 52,
        now,
      })
    ).toBeNull();
  });

  it("still FAILS mid-path large lag after grace", () => {
    expect(
      detectScrollPathDeviation({
        startTop: 0,
        targetTop: 400,
        duration: 800,
        startTime: 0,
        actualTop: 80,
        now: 400, // progress 0.5
      })?.kind
    ).toBe("scroll-path-deviation");
  });

  it("does not false-positive plp-open-pdp eased scroll at early progress", () => {
    const startTop = 0;
    const targetTop = 290;
    const duration = 720;
    const now = 36;
    const progress = now / duration;
    const expected =
      startTop + (targetTop - startTop) * (1 - Math.pow(1 - progress, 3));
    expect(
      detectScrollPathDeviation({
        startTop,
        targetTop,
        duration,
        startTime: 0,
        actualTop: Math.round(expected),
        now,
      })
    ).toBeNull();
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
