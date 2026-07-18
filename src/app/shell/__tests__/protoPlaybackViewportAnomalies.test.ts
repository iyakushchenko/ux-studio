import { describe, expect, it } from "vitest";
import {
  detectTransportRetreatMismatch,
  detectViewportStallAfterAdvance,
  VIEWPORT_MIN_SCROLL_DELTA_PX,
} from "@/app/shell/protoPlaybackViewportAnomalies";

describe("protoPlaybackViewportAnomalies", () => {
  it("detects viewport stall when touchpoint advances on same screen", () => {
    const anomaly = detectViewportStallAfterAdvance({
      scrollTop: 12,
      baselineScrollTop: 8,
      childIndex: 4,
      baselineChildIndex: 4,
      beatId: "book-step2-time",
      baselineBeatId: "book-step2-date",
      beatLabel: "Book — time",
      baselineTouchpointKey: "beat:book-step2-date",
      touchpointKey: "beat:book-step2-time",
      isScripting: false,
      isPausingBeforeReveal: false,
      screenFramesBeat: false,
      anchorInView: false,
      anchorProminent: false,
      expectsViewportFollow: true,
      transportAction: "step-forward",
    });

    expect(anomaly?.kind).toBe("viewport-stall");
    expect(anomaly?.message).toContain("Book — time");
  });

  it("passes when scroll moved enough", () => {
    const anomaly = detectViewportStallAfterAdvance({
      scrollTop: VIEWPORT_MIN_SCROLL_DELTA_PX + 100,
      baselineScrollTop: 0,
      childIndex: 4,
      baselineChildIndex: 4,
      beatId: "book-step2-time",
      baselineBeatId: "book-step2-date",
      touchpointKey: "beat:book-step2-time",
      baselineTouchpointKey: "beat:book-step2-date",
      isScripting: false,
      isPausingBeforeReveal: false,
      screenFramesBeat: false,
      anchorInView: false,
      anchorProminent: false,
      expectsViewportFollow: true,
    });

    expect(anomaly).toBeNull();
  });

  it("passes when focal anchor center is prominently in view", () => {
    const anomaly = detectViewportStallAfterAdvance({
      scrollTop: 0,
      baselineScrollTop: 0,
      childIndex: 4,
      baselineChildIndex: 4,
      beatId: "book-step2-time",
      baselineBeatId: "book-step2-date",
      touchpointKey: "beat:book-step2-time",
      baselineTouchpointKey: "beat:book-step2-date",
      isScripting: false,
      isPausingBeforeReveal: false,
      screenFramesBeat: false,
      anchorInView: true,
      anchorProminent: true,
      expectsViewportFollow: true,
    });

    expect(anomaly).toBeNull();
  });

  it("flags when anchor peeks but center is off-screen", () => {
    const anomaly = detectViewportStallAfterAdvance({
      scrollTop: 0,
      baselineScrollTop: 0,
      childIndex: 4,
      baselineChildIndex: 4,
      beatId: "book-step2-time",
      baselineBeatId: "book-step2-date",
      touchpointKey: "beat:book-step2-time",
      baselineTouchpointKey: "beat:book-step2-date",
      isScripting: false,
      isPausingBeforeReveal: false,
      screenFramesBeat: false,
      anchorInView: true,
      anchorProminent: false,
      expectsViewportFollow: true,
      transportAction: "step-forward",
    });

    expect(anomaly?.kind).toBe("viewport-stall");
  });

  it("ignores transitions that do not expect viewport follow", () => {
    expect(
      detectViewportStallAfterAdvance({
        scrollTop: 0,
        baselineScrollTop: 0,
        childIndex: 4,
        baselineChildIndex: 4,
        beatId: "book-step2",
        baselineBeatId: "choose-location",
        isScripting: false,
        isPausingBeforeReveal: false,
        screenFramesBeat: false,
        anchorInView: false,
        anchorProminent: false,
        expectsViewportFollow: false,
      })
    ).toBeNull();
  });

  it("ignores popup touchpoints (login, availability, etc.)", () => {
    expect(
      detectViewportStallAfterAdvance({
        scrollTop: 149,
        baselineScrollTop: 149,
        childIndex: 8,
        baselineChildIndex: 8,
        beatId: "traditional-login",
        baselineBeatId: "traditional-pdp",
        baselineTouchpointKey: "popup:login",
        touchpointKey: "popup:login",
        isScripting: false,
        isPausingBeforeReveal: false,
        screenFramesBeat: false,
        anchorInView: false,
        anchorProminent: false,
        expectsViewportFollow: true,
        transportAction: "script-end",
      })
    ).toBeNull();
  });
});

describe("detectTransportRetreatMismatch", () => {
  it("flags step back when prototype tab does not match beat protoTab", () => {
    const anomaly = detectTransportRetreatMismatch({
      transportAction: "step-back",
      beatId: "traditional-pdp",
      beatLabel: "Vaccination details",
      beatProtoTab: 4,
      childIndex: 7,
      touchpointKey: "beat:traditional-pdp",
      screenFramesBeat: false,
    });
    expect(anomaly?.kind).toBe("transport-retreat-mismatch");
    expect(anomaly?.message).toContain("Vaccination details");
  });

  it("flags step back when touchpoint is still a popup overlay", () => {
    const anomaly = detectTransportRetreatMismatch({
      transportAction: "step-back",
      beatId: "traditional-pdp",
      beatProtoTab: 4,
      childIndex: 8,
      touchpointKey: "popup:availability:list",
      screenFramesBeat: false,
    });
    expect(anomaly?.kind).toBe("transport-retreat-mismatch");
    expect(anomaly?.message).toContain("popup");
  });

  it("ignores non step-back transport", () => {
    expect(
      detectTransportRetreatMismatch({
        transportAction: "step-forward",
        beatId: "traditional-pdp",
        beatProtoTab: 4,
        childIndex: 7,
        screenFramesBeat: false,
      })
    ).toBeNull();
  });
});
