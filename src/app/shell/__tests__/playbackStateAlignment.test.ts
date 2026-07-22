import { describe, expect, it } from "vitest";
import type { JourneyBeat } from "@/app/orchestra/types";
import type { StudioTouchpointEntry } from "@/app/nav/resolveStudioTouchpoint";
import {
  detectPlaybackStateAlignment,
  shouldDiscardQueuedAlignmentFrame,
} from "@/app/shell/playbackStateAlignment";

const beat: JourneyBeat = {
  id: "details",
  label: "Details",
  kind: "tab-landing",
  protoTab: 2,
};

const playlist: StudioTouchpointEntry[] = [
  { key: "beat:list", label: "List" },
  { key: "beat:details", label: "Details" },
  { key: "beat:confirm", label: "Confirm" },
];

function detect(overrides: Partial<Parameters<typeof detectPlaybackStateAlignment>[0]> = {}) {
  return detectPlaybackStateAlignment({
    beat,
    playlist,
    touchpointKey: "beat:details",
    currentTabIndex: 1,
    expectedTabIndex: 1,
    renderedScreenId: "details",
    addressScreenId: "details",
    visibleCount: 2,
    totalFrames: 3,
    ...overrides,
  });
}

describe("detectPlaybackStateAlignment", () => {
  it("passes an aligned settled frame", () => {
    expect(detect()).toEqual([]);
  });

  it("detects the rendered screen diverging from the real URL", () => {
    expect(detect({ addressScreenId: "list" }).map((item) => item.kind)).toContain(
      "screen-url-mismatch"
    );
  });

  it("detects the active beat diverging from the rendered tab", () => {
    expect(detect({ currentTabIndex: 0 }).map((item) => item.kind)).toContain(
      "beat-tab-mismatch"
    );
  });

  it("detects a normal touchpoint belonging to another beat", () => {
    expect(
      detect({ touchpointKey: "beat:confirm", visibleCount: 3 }).map(
        (item) => item.kind
      )
    ).toContain("touchpoint-beat-mismatch");
  });

  it("detects a counter that disagrees with its touchpoint", () => {
    expect(detect({ visibleCount: 1 }).map((item) => item.kind)).toContain(
      "counter-touchpoint-mismatch"
    );
  });

  it("allows a registered popup substep and its beat-anchored counter", () => {
    const popupBeat: JourneyBeat = {
      id: "choose-location",
      label: "Choose location",
      kind: "tab-landing",
      protoTab: 5,
    };
    const popupPlaylist: StudioTouchpointEntry[] = [
      { key: "beat:choose-location", label: "Choose location" },
      { key: "popup:availability:list", label: "Choose pharmacy" },
    ];

    expect(
      detectPlaybackStateAlignment({
        beat: popupBeat,
        playlist: popupPlaylist,
        touchpointKey: "popup:availability:list",
        currentTabIndex: 4,
        expectedTabIndex: 4,
        renderedScreenId: "book-step-1",
        addressScreenId: "book-step-1",
        visibleCount: 1,
        totalFrames: 2,
      })
    ).toEqual([]);
  });

  it("allows chat frames to advance while the screen-frame beat stays active", () => {
    const chatBeat: JourneyBeat = {
      id: "agentic-chat",
      label: "Chat",
      kind: "screen-frames",
      protoTab: 2,
      scenarioId: "site-pilot-chat",
    };
    const chatPlaylist: StudioTouchpointEntry[] = [1, 2, 3].map((frame) => ({
      key: `beat:agentic-chat:frame:${frame}`,
      label: `Chat ${frame}`,
    }));

    expect(
      detectPlaybackStateAlignment({
        beat: chatBeat,
        playlist: chatPlaylist,
        touchpointKey: "beat:agentic-chat:frame:2",
        currentTabIndex: 1,
        expectedTabIndex: 1,
        renderedScreenId: "chat",
        addressScreenId: "chat",
        visibleCount: 2,
        totalFrames: 3,
      })
    ).toEqual([]);
  });
});

describe("shouldDiscardQueuedAlignmentFrame", () => {
  const captured = { beatId: "camera", touchpointKey: "beat:camera" };

  it("discards the queued camera frame after the confirmation handoff", () => {
    expect(
      shouldDiscardQueuedAlignmentFrame(captured, {
        beatId: "confirmation",
        touchpointKey: "beat:confirmation",
        isScripting: true,
      })
    ).toBe(true);
  });

  it("discards alignment sampling during an on-air cross-screen handoff", () => {
    expect(
      shouldDiscardQueuedAlignmentFrame(captured, {
        ...captured,
        isOnAir: true,
      })
    ).toBe(true);
  });

  it("keeps a genuinely stable queued frame", () => {
    expect(shouldDiscardQueuedAlignmentFrame(captured, captured)).toBe(false);
  });
});
