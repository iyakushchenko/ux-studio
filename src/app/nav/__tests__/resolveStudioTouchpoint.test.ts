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

  it("uses book confirmed label on step 3 confirmation screen", () => {
    expect(
      resolveStudioTouchpoint({
        availabilityOpen: false,
        vaccinePickerOpen: false,
        recipientPickerOpen: false,
        loginPopupOpen: false,
        quickViewOpen: false,
        beatId: "book-step2-reserve",
        beatLabel: "Book — reserve",
        bookConfirmationScreen: true,
      })
    ).toEqual({ label: "Book — confirmed", key: "beat:confirmation" });
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

    expect(fullPlaylist).toHaveLength(13);
    expect(skippedPlaylist).toHaveLength(12);
    expect(fullPlaylist.length).not.toBe(skippedPlaylist.length);
  });

  it("keeps a stable agentic playlist length with full chat frame expansion", () => {
    const playlist = buildStudioTouchpointPlaylist(
      AGENTIC_CJM_JOURNEY,
      chatFrames,
      { popupTouchpoints: BOOTS_PHARMACY_POPUP_TOUCHPOINTS }
    );

    // 9 chat content frames only — no separate :thinking playlist slots.
    // +1 camera beat before confirmation (shared POST_CONFIRMATION).
    expect(playlist).toHaveLength(22);
    expect(
      playlist.some((entry) => entry.key.includes(":thinking"))
    ).toBe(false);
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
    ).toEqual({ visibleCount: 8, totalFrames: 13 });
  });

  it("maps popup:login to the traditional login beat in the playlist", () => {
    expect(
      resolveStudioTouchpointProgress(traditionalPlaylist, "popup:login")
    ).toEqual({ visibleCount: 3, totalFrames: 13 });
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
    ).toEqual({ visibleCount: 4, totalFrames: 13 });
    expect(
      resolveStudioTouchpointProgress(traditionalPlaylist, "popup:availability:list")
    ).toEqual({ visibleCount: 5, totalFrames: 13 });
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
    ).toEqual({ visibleCount: 12, totalFrames: 12 });
  });

  it("resolves agentic chat frame 3 within the full journey total", () => {
    expect(
      resolveStudioTouchpointProgress(
        agenticPlaylist,
        "beat:agentic-chat:frame:3"
      )
    ).toEqual({ visibleCount: 4, totalFrames: 22 });
  });

  it("maps legacy thinking keys onto the reply frame playlist slot", () => {
    expect(
      resolveStudioTouchpointProgress(
        agenticPlaylist,
        "beat:agentic-chat:frame:4:thinking"
      )
    ).toEqual(
      resolveStudioTouchpointProgress(
        agenticPlaylist,
        "beat:agentic-chat:frame:4"
      )
    );
  });

  it("pins STEPS on the upcoming reply frame while thinking (one SF = +1)", () => {
    expect(
      resolveStudioTouchpoint({
        beatId: "agentic-chat",
        beatLabel: "Chat experience",
        availabilityOpen: false,
        vaccinePickerOpen: false,
        recipientPickerOpen: false,
        loginPopupOpen: false,
        quickViewOpen: false,
        chatFrameIndex: 1,
        chatFrameTotal: 9,
        chatPausingBeforeReveal: true,
        chatPlaybackThinking: true,
      })
    ).toEqual({
      key: "beat:agentic-chat:frame:2",
      label: "Chat experience — thinking",
    });
  });

  it("maps availability start popups to the avail-location beat", () => {
    expect(
      resolveStudioTouchpointProgress(
        agenticPlaylist,
        "popup:availability:start"
      )
    ).toEqual({ visibleCount: 11, totalFrames: 22 });
  });

  it("anchors avail-time STEPS on popup:availability:time (not beat:avail-time)", () => {
    const availTimeBeat = AGENTIC_CJM_JOURNEY.beats.find(
      (beat) => beat.id === "avail-time"
    );
    expect(
      resolveStudioTouchpointProgressForBeat(
        agenticPlaylist,
        "popup:availability:time",
        availTimeBeat
      ).visibleCount
    ).toBeGreaterThan(0);
    expect(
      resolveStudioTouchpointProgress(
        agenticPlaylist,
        "popup:availability:time"
      ).visibleCount
    ).toBeGreaterThan(0);
  });

  it("anchors avail-continue STEPS on popup:availability:date", () => {
    const availContinueBeat = AGENTIC_CJM_JOURNEY.beats.find(
      (beat) => beat.id === "avail-continue"
    );
    expect(
      resolveStudioTouchpointProgressForBeat(
        agenticPlaylist,
        "popup:availability:date",
        availContinueBeat
      ).visibleCount
    ).toBeGreaterThan(0);
  });
});
