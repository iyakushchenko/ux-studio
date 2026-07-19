import { describe, expect, it } from "vitest";
import {
  detectDirectorScriptOffAir,
  detectPlaylistFrameSkip,
  detectStrayPopupOnBeat,
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

  it("allows confirmation chain landing on appointment details", () => {
    expect(
      detectPlaylistFrameSkip({
        prevTouchpointIndex: 21,
        nextTouchpointIndex: 23,
        prevTouchpointKey: "beat:confirmation",
        nextTouchpointKey: "beat:appointment-details",
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

  it("allows chat scenario frame substeps on agentic-chat beat", () => {
    expect(
      detectTouchpointAheadOfBeat({
        beatPlaylistIndex: 1,
        touchpointPlaylistIndex: 3,
        beatId: "agentic-chat",
        touchpointKey: "beat:agentic-chat:frame:2",
      })
    ).toBeNull();
    expect(
      detectTouchpointAheadOfBeat({
        beatPlaylistIndex: 1,
        touchpointPlaylistIndex: 2,
        beatId: "agentic-chat",
        touchpointKey: "beat:agentic-chat:frame:2:thinking",
      })
    ).toBeNull();
  });

  it("allows login popup while beat is still on traditional-plp (PDP script lag)", () => {
    expect(
      detectTouchpointAheadOfBeat({
        beatPlaylistIndex: 0,
        touchpointPlaylistIndex: 2,
        beatId: "traditional-plp",
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

describe("detectStrayPopupOnBeat", () => {
  it("flags availability overlay still open on book-step2", () => {
    const anomaly = detectStrayPopupOnBeat({
      beatId: "book-step2",
      availabilityOpen: true,
    });
    expect(anomaly?.kind).toBe("stray-popup-on-beat");
    expect(anomaly?.message).toContain("availability");
  });

  it("passes when book-step2 has no popups open", () => {
    expect(
      detectStrayPopupOnBeat({
        beatId: "book-step2",
        availabilityOpen: false,
        loginPopupOpen: false,
      })
    ).toBeNull();
  });

  it("ignores other beats", () => {
    expect(
      detectStrayPopupOnBeat({
        beatId: "choose-location",
        availabilityOpen: true,
      })
    ).toBeNull();
  });

  it("ignores book-step2 while director script is still running", () => {
    expect(
      detectStrayPopupOnBeat({
        beatId: "book-step2",
        isScripting: true,
        availabilityOpen: true,
      })
    ).toBeNull();
  });
});
