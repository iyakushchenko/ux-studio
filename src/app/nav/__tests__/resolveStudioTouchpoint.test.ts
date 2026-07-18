import { describe, expect, it } from "vitest";
import {
  buildStudioTouchpointPlaylist,
  resolveStableChatScenarioPlaylistFrames,
  resolveStudioTouchpoint,
  resolveStudioTouchpointProgress,
  resolveStudioTouchpointProgressForBeat,
} from "@/app/nav/resolveStudioTouchpoint";
import { BOOTS_PHARMACY_POPUP_TOUCHPOINTS } from "@/projects/boots-pharmacy/touchpoints";
import {
  AGENTIC_CJM_JOURNEY,
  TRADITIONAL_CJM_JOURNEY,
  shouldSkipTraditionalLoginBeat,
} from "@/projects/boots-pharmacy/personas/sarah-jenkins/journeys";

describe("resolveStudioTouchpoint", () => {
  it("uses short availability step labels", () => {
    expect(
      resolveStudioTouchpoint({
        availabilityOpen: true,
        availStep: "list",
        vaccinePickerOpen: false,
        recipientPickerOpen: false,
        loginPopupOpen: false,
        quickViewOpen: false,
      })
    ).toEqual({ label: "Choose pharmacy", key: "popup:availability:list" });
  });

  it("uses short popup labels", () => {
    expect(
      resolveStudioTouchpoint({
        availabilityOpen: false,
        vaccinePickerOpen: true,
        recipientPickerOpen: false,
        loginPopupOpen: false,
        quickViewOpen: false,
      })
    ).toEqual({ label: "Choose vaccine", key: "popup:vaccine" });
  });
});

describe("buildStudioTouchpointPlaylist", () => {
  const chatFrames = resolveStableChatScenarioPlaylistFrames("site-pilot-chat");

  it("keeps a stable traditional playlist length regardless of login skip policy", () => {
    const fullPlaylist = buildStudioTouchpointPlaylist(
      TRADITIONAL_CJM_JOURNEY,
      chatFrames,
      { popupTouchpoints: BOOTS_PHARMACY_POPUP_TOUCHPOINTS }
    );
    const skippedPlaylist = buildStudioTouchpointPlaylist(
      TRADITIONAL_CJM_JOURNEY,
      chatFrames,
      {
        popupTouchpoints: BOOTS_PHARMACY_POPUP_TOUCHPOINTS,
        shouldSkipBeat: (beat) => shouldSkipTraditionalLoginBeat(beat, true),
      }
    );

    expect(fullPlaylist).toHaveLength(12);
    expect(skippedPlaylist).toHaveLength(11);
    expect(fullPlaylist.length).not.toBe(skippedPlaylist.length);
  });

  it("keeps a stable agentic playlist length with full chat frame expansion", () => {
    const playlist = buildStudioTouchpointPlaylist(
      AGENTIC_CJM_JOURNEY,
      chatFrames,
      { popupTouchpoints: BOOTS_PHARMACY_POPUP_TOUCHPOINTS }
    );

    expect(playlist).toHaveLength(25);
  });
});

describe("resolveStudioTouchpointProgress", () => {
  const chatFrames = resolveStableChatScenarioPlaylistFrames("site-pilot-chat");
  const traditionalPlaylist = buildStudioTouchpointPlaylist(
    TRADITIONAL_CJM_JOURNEY,
    chatFrames,
    { popupTouchpoints: BOOTS_PHARMACY_POPUP_TOUCHPOINTS }
  );
  const agenticPlaylist = buildStudioTouchpointPlaylist(
    AGENTIC_CJM_JOURNEY,
    chatFrames,
    { popupTouchpoints: BOOTS_PHARMACY_POPUP_TOUCHPOINTS }
  );

  it("resolves traditional book-time against the full journey total", () => {
    expect(
      resolveStudioTouchpointProgress(traditionalPlaylist, "beat:book-step2-time")
    ).toEqual({ visibleCount: 8, totalFrames: 12 });
  });

  it("maps popup:login to the traditional login beat in the playlist", () => {
    expect(
      resolveStudioTouchpointProgress(traditionalPlaylist, "popup:login")
    ).toEqual({ visibleCount: 3, totalFrames: 12 });
  });

  it("anchors choose-location beat counter before availability popup sub-step", () => {
    const chooseLocationBeat = TRADITIONAL_CJM_JOURNEY.beats.find(
      (beat) => beat.id === "choose-location"
    );
    expect(
      resolveStudioTouchpointProgressForBeat(
        traditionalPlaylist,
        "popup:availability:list",
        chooseLocationBeat
      )
    ).toEqual({ visibleCount: 4, totalFrames: 12 });
    expect(
      resolveStudioTouchpointProgress(traditionalPlaylist, "popup:availability:list")
    ).toEqual({ visibleCount: 5, totalFrames: 12 });
  });

  it("uses skipped-login playlist length for logged-in Sarah", () => {
    const skippedPlaylist = buildStudioTouchpointPlaylist(
      TRADITIONAL_CJM_JOURNEY,
      chatFrames,
      {
        popupTouchpoints: BOOTS_PHARMACY_POPUP_TOUCHPOINTS,
        shouldSkipBeat: (beat) => shouldSkipTraditionalLoginBeat(beat, true),
      }
    );
    expect(
      resolveStudioTouchpointProgress(
        skippedPlaylist,
        "beat:appointment-details"
      )
    ).toEqual({ visibleCount: 11, totalFrames: 11 });
  });

  it("resolves agentic chat frame 3 within the full journey total", () => {
    expect(
      resolveStudioTouchpointProgress(
        agenticPlaylist,
        "beat:agentic-chat:frame:3"
      )
    ).toEqual({ visibleCount: 5, totalFrames: 25 });
  });

  it("resolves agentic chat thinking sub-steps", () => {
    expect(
      resolveStudioTouchpointProgress(
        agenticPlaylist,
        "beat:agentic-chat:frame:4:thinking"
      )
    ).toEqual({ visibleCount: 6, totalFrames: 25 });
  });

  it("maps availability start popups to the avail-location beat", () => {
    expect(
      resolveStudioTouchpointProgress(
        agenticPlaylist,
        "popup:availability:start"
      )
    ).toEqual({ visibleCount: 15, totalFrames: 25 });
  });
});
