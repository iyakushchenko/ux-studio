import { describe, expect, it } from "vitest";
import {
  canRetreatJourneyTouchpoint,
  firstPlayableBeatIndex,
  getJourneyForMode,
  lastPlayableBeatIndex,
  resolveBeatIndexForScreenTab,
  resolveJourneyRetreatTarget,
  resolveJourneyStartBeat,
  stepBeatIndex,
} from "@/app/orchestra/journeyUtils";
import type { JourneyBeat, JourneyDefinition } from "@/app/orchestra/types";
import { buildStudioTouchpointPlaylist } from "@/app/nav/resolveStudioTouchpoint";
import { BOOTS_PHARMACY_POPUP_TOUCHPOINTS } from "@/projects/boots-pharmacy/touchpoints";
import {
  AGENTIC_CJM_JOURNEY,
  shouldSkipTraditionalLoginBeat,
  TRADITIONAL_CJM_JOURNEY,
  TRADITIONAL_LOGIN_BEAT_ID,
} from "@/projects/boots-pharmacy/personas/sarah-jenkins/journeys";

const beats: JourneyBeat[] = [
  { id: "a", label: "A", kind: "tab-landing", protoTab: 1 },
  { id: "skip-me", label: "Skip", kind: "tab-landing", protoTab: 2 },
  { id: "c", label: "C", kind: "tab-landing", protoTab: 3 },
];

const shouldSkip = (beat: JourneyBeat | undefined) => beat?.id === "skip-me";

describe("stepBeatIndex", () => {
  it("advances past skipped beats forward", () => {
    expect(stepBeatIndex(0, beats, shouldSkip, 1)).toBe(2);
  });

  it("steps back past skipped beats", () => {
    expect(stepBeatIndex(2, beats, shouldSkip, -1)).toBe(0);
  });

  it("returns out-of-range index when no playable beat remains", () => {
    const onlySkipped: JourneyBeat[] = [
      { id: "skip-me", label: "Skip", kind: "tab-landing" },
    ];
    expect(stepBeatIndex(0, onlySkipped, shouldSkip, 1)).toBe(1);
  });
});

describe("firstPlayableBeatIndex / lastPlayableBeatIndex", () => {
  it("finds first and last non-skipped beats", () => {
    expect(firstPlayableBeatIndex(beats, shouldSkip)).toBe(0);
    expect(lastPlayableBeatIndex(beats, shouldSkip)).toBe(2);
  });
});

describe("getJourneyForMode", () => {
  const journeys: JourneyDefinition[] = [
    { id: "agentic-cjm", label: "Agentic", beats: [] },
    { id: "traditional-cjm", label: "Traditional", beats: [] },
  ];

  it("resolves journey by mode id", () => {
    expect(getJourneyForMode(journeys, "agentic-cjm")?.label).toBe("Agentic");
    expect(getJourneyForMode(journeys, "traditional-cjm")?.label).toBe("Traditional");
  });
});

describe("resolveBeatIndexForScreenTab", () => {
  it("returns the first playable beat on the requested proto tab", () => {
    expect(
      resolveBeatIndexForScreenTab(
        {
          id: "traditional-cjm",
          label: "Traditional",
          beats: [
            { id: "plp", label: "PLP", kind: "tab-landing", protoTab: 3 },
            { id: "pdp", label: "PDP", kind: "tab-landing", protoTab: 4 },
            { id: "book", label: "Book", kind: "tab-landing", protoTab: 6 },
            { id: "book-date", label: "Date", kind: "tab-landing", protoTab: 6 },
          ],
        },
        studioTabToIndex(6),
        () => false
      )
    ).toBe(2);
  });

  it("falls back to the journey start beat when the tab has no beats", () => {
    expect(
      resolveBeatIndexForScreenTab(
        AGENTIC_CJM_JOURNEY,
        studioTabToIndex(5),
        () => false
      )
    ).toBe(0);
  });
});

function studioTabToIndex(tab: number): number {
  return Math.max(0, tab - 1);
}

describe("resolveJourneyStartBeat", () => {
  it("returns first playable beat for Traditional when logged in", () => {
    const shouldSkip = (beat: JourneyBeat | undefined) =>
      shouldSkipTraditionalLoginBeat(beat, true);
    const { beatIndex, beat } = resolveJourneyStartBeat(
      AGENTIC_CJM_JOURNEY,
      shouldSkip
    );
    expect(beatIndex).toBe(0);
    expect(beat?.id).toBe("agentic-home");

    const traditional = resolveJourneyStartBeat(
      {
        id: "traditional-cjm",
        label: "Traditional CJM",
        beats: [
          { id: "traditional-plp", label: "PLP", kind: "tab-landing", protoTab: 3 },
          {
            id: TRADITIONAL_LOGIN_BEAT_ID,
            label: "Log in",
            kind: "tab-landing",
            protoTab: 4,
          },
        ],
      },
      shouldSkip
    );
    expect(traditional.beatIndex).toBe(0);
    expect(traditional.beat?.id).toBe("traditional-plp");
  });
});

describe("resolveJourneyRetreatTarget", () => {
  const chatFrames = 9;
  const playlist = buildStudioTouchpointPlaylist(
    TRADITIONAL_CJM_JOURNEY,
    chatFrames,
    {
      popupTouchpoints: BOOTS_PHARMACY_POPUP_TOUCHPOINTS,
      shouldSkipBeat: (beat) => shouldSkipTraditionalLoginBeat(beat, true),
    }
  );

  it("steps back from choose-location to PDP when login is skipped", () => {
    const target = resolveJourneyRetreatTarget({
      playlist,
      currentTouchpointKey: "beat:choose-location",
      currentBeatId: "choose-location",
      beats: TRADITIONAL_CJM_JOURNEY.beats,
      shouldSkipBeat: (beat) => shouldSkipTraditionalLoginBeat(beat, true),
    });
    expect(target).toEqual({
      kind: "beat",
      beatIndex: 1,
      beat: TRADITIONAL_CJM_JOURNEY.beats[1],
    });
    expect(target && target.kind === "beat" ? target.beat.id : "").toBe(
      "traditional-pdp"
    );
  });

  it("closes popups before changing beat when retreating from availability overlay", () => {
    const target = resolveJourneyRetreatTarget({
      playlist,
      currentTouchpointKey: "popup:availability:list",
      currentBeatId: "choose-location",
      beats: TRADITIONAL_CJM_JOURNEY.beats,
      shouldSkipBeat: (beat) => shouldSkipTraditionalLoginBeat(beat, true),
    });
    expect(target).toEqual({ kind: "close-popups" });
  });

  it("closes popups for agentic avail-location list (does not jump to chat/home)", () => {
    const agenticPlaylist = buildStudioTouchpointPlaylist(AGENTIC_CJM_JOURNEY, 9);
    const target = resolveJourneyRetreatTarget({
      playlist: agenticPlaylist,
      currentTouchpointKey: "popup:availability:list",
      currentBeatId: "avail-location",
      beats: AGENTIC_CJM_JOURNEY.beats,
      shouldSkipBeat: () => false,
    });
    expect(target).toEqual({ kind: "close-popups" });
  });

  it("closes sticky avail list when beat already retreated to agentic-home", () => {
    const agenticPlaylist = buildStudioTouchpointPlaylist(AGENTIC_CJM_JOURNEY, 9);
    const target = resolveJourneyRetreatTarget({
      playlist: agenticPlaylist,
      currentTouchpointKey: "popup:availability:list",
      currentBeatId: "agentic-home",
      beats: AGENTIC_CJM_JOURNEY.beats,
      shouldSkipBeat: () => false,
    });
    expect(target).toEqual({ kind: "close-popups" });
  });

  it("maps agentic avail-book retreat to avail-time beat (not avail-location)", () => {
    const playlist = buildStudioTouchpointPlaylist(AGENTIC_CJM_JOURNEY, 9);
    const target = resolveJourneyRetreatTarget({
      playlist,
      currentTouchpointKey: "beat:avail-book",
      currentBeatId: "avail-book",
      beats: AGENTIC_CJM_JOURNEY.beats,
      shouldSkipBeat: () => false,
    });
    expect(target).toEqual({
      kind: "beat",
      beatIndex: AGENTIC_CJM_JOURNEY.beats.findIndex((b) => b.id === "avail-time"),
      beat: AGENTIC_CJM_JOURNEY.beats.find((b) => b.id === "avail-time"),
    });
  });

  it("maps agentic avail-time retreat to avail-continue beat", () => {
    const playlist = buildStudioTouchpointPlaylist(AGENTIC_CJM_JOURNEY, 9);
    const target = resolveJourneyRetreatTarget({
      playlist,
      currentTouchpointKey: "popup:availability:time",
      currentBeatId: "avail-time",
      beats: AGENTIC_CJM_JOURNEY.beats,
      shouldSkipBeat: () => false,
    });
    expect(target?.kind).toBe("beat");
    if (target?.kind === "beat") {
      expect(target.beat.id).toBe("avail-continue");
    }
  });

  it("reports playlist retreat availability for choose-location", () => {
    expect(
      canRetreatJourneyTouchpoint(playlist, "beat:choose-location")
    ).toBe(true);
    expect(canRetreatJourneyTouchpoint(playlist, "beat:traditional-plp")).toBe(
      false
    );
  });

  it("steps back from traditional book-step2-time to book-step2-date", () => {
    const target = resolveJourneyRetreatTarget({
      playlist,
      currentTouchpointKey: "beat:book-step2-time",
      currentBeatId: "book-step2-time",
      beats: TRADITIONAL_CJM_JOURNEY.beats,
      shouldSkipBeat: (beat) => shouldSkipTraditionalLoginBeat(beat, true),
    });
    expect(target?.kind).toBe("beat");
    if (target?.kind === "beat") {
      expect(target.beat.id).toBe("book-step2-date");
    }
  });

  it("steps back from traditional book-step2-reserve to book-step2-time", () => {
    const target = resolveJourneyRetreatTarget({
      playlist,
      currentTouchpointKey: "beat:book-step2-reserve",
      currentBeatId: "book-step2-reserve",
      beats: TRADITIONAL_CJM_JOURNEY.beats,
      shouldSkipBeat: (beat) => shouldSkipTraditionalLoginBeat(beat, true),
    });
    expect(target?.kind).toBe("beat");
    if (target?.kind === "beat") {
      expect(target.beat.id).toBe("book-step2-time");
    }
  });

  it("steps back from traditional confirmation to book-step3-camera", () => {
    const target = resolveJourneyRetreatTarget({
      playlist,
      currentTouchpointKey: "beat:confirmation",
      currentBeatId: "confirmation",
      beats: TRADITIONAL_CJM_JOURNEY.beats,
      shouldSkipBeat: (beat) => shouldSkipTraditionalLoginBeat(beat, true),
    });
    expect(target?.kind).toBe("beat");
    if (target?.kind === "beat") {
      expect(target.beat.id).toBe("book-step3-camera");
    }
  });

  it("steps back from book-step3-camera to book-step2-reserve", () => {
    const target = resolveJourneyRetreatTarget({
      playlist,
      currentTouchpointKey: "beat:book-step3-camera",
      currentBeatId: "book-step3-camera",
      beats: TRADITIONAL_CJM_JOURNEY.beats,
      shouldSkipBeat: (beat) => shouldSkipTraditionalLoginBeat(beat, true),
    });
    expect(target?.kind).toBe("beat");
    if (target?.kind === "beat") {
      expect(target.beat.id).toBe("book-step2-reserve");
    }
  });
});
