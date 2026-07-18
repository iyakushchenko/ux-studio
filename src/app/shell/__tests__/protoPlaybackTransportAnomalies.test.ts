import { describe, expect, it } from "vitest";
import {
  detectDirectorScriptOffAir,
  detectPlaylistFrameSkip,
  detectTouchpointAheadOfBeat,
} from "@/app/shell/protoPlaybackTransportAnomalies";

describe("detectPlaylistFrameSkip", () => {
  it("flags when one step jumps over a playlist frame", () => {
    const anomaly = detectPlaylistFrameSkip({
      prevTouchpointIndex: 2,
      nextTouchpointIndex: 4,
      beatId: "choose-location",
      nextTouchpointKey: "popup:availability:list",
    });
    expect(anomaly?.kind).toBe("playlist-frame-skip");
    expect(anomaly?.message).toContain("skipped 1 frame");
  });

  it("allows single-frame advances", () => {
    expect(
      detectPlaylistFrameSkip({
        prevTouchpointIndex: 2,
        nextTouchpointIndex: 3,
        nextTouchpointKey: "beat:choose-location",
      })
    ).toBeNull();
  });
});

describe("detectTouchpointAheadOfBeat", () => {
  it("allows availability popup sub-steps on choose-location beat", () => {
    expect(
      detectTouchpointAheadOfBeat({
        beatPlaylistIndex: 3,
        touchpointPlaylistIndex: 4,
        beatId: "choose-location",
        touchpointKey: "popup:availability:list",
      })
    ).toBeNull();
  });

  it("allows the immediate next playlist frame before beat advances (PDP → login popup)", () => {
    expect(
      detectTouchpointAheadOfBeat({
        beatPlaylistIndex: 1,
        touchpointPlaylistIndex: 2,
        beatId: "traditional-pdp",
        touchpointKey: "popup:login",
      })
    ).toBeNull();
  });

  it("flags touchpoint ahead of beat when gap is two or more frames", () => {
    const anomaly = detectTouchpointAheadOfBeat({
      beatPlaylistIndex: 3,
      touchpointPlaylistIndex: 5,
      beatId: "choose-location",
      touchpointKey: "beat:book-step2",
    });
    expect(anomaly?.kind).toBe("touchpoint-ahead-of-beat");
  });
});

describe("detectDirectorScriptOffAir", () => {
  it("flags scripting without on-air", () => {
    const anomaly = detectDirectorScriptOffAir({
      isScripting: true,
      isOnAir: false,
      beatId: "book-step2-time",
      scriptLabel: "select-book-time",
    });
    expect(anomaly?.kind).toBe("director-script-off-air");
  });

  it("passes when scripting and on-air agree", () => {
    expect(
      detectDirectorScriptOffAir({
        isScripting: true,
        isOnAir: true,
        beatId: "book-step2-time",
        scriptLabel: "select-book-time",
      })
    ).toBeNull();
  });
});
