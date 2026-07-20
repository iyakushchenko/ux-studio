import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertPlaybackPlayEndedAtStart,
  assertPlaybackTypeIn,
  getPlaybackDiagBundle,
  playbackDiagBeat,
  playbackDiagClear,
  playbackDiagClick,
  playbackDiagCursor,
  playbackDiagHubNav,
  playbackDiagJourneyReset,
  playbackDiagLog,
  playbackDiagNavCross,
  playbackDiagPlayEnd,
  playbackDiagScreenEnter,
  playbackDiagScroll,
  playbackDiagSkip,
  playbackDiagTarget,
  playbackDiagTypeInEnd,
  playbackDiagTypeInProgress,
  playbackDiagTypeInSkip,
  playbackDiagTypeInStart,
  playbackDiagChatBubbleMotion,
} from "@/app/shell/playbackDiag";
import {
  openQaDiagGate,
  resetQaDiagGateForTests,
} from "@/app/shell/qaDiagGate";

describe("playbackDiag", () => {
  beforeEach(() => {
    // Console emit is gated — open for suites that assert [PLAYBACK_DIAG] noise.
    openQaDiagGate({ reason: "playbackDiag-test" });
  });

  afterEach(() => {
    playbackDiagClear();
    resetQaDiagGateForTests();
    vi.restoreAllMocks();
  });

  it("records chat-bubble-motion samples only while gate open", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagChatBubbleMotion({
      id: "r0",
      phase: "animate-start",
      y: 14,
      opacity: 0,
      deltaY: 0,
      shouldAnimate: true,
    });
    playbackDiagChatBubbleMotion({
      id: "r0",
      phase: "frame",
      y: 10,
      opacity: 0.3,
      deltaY: 1,
      shouldAnimate: true,
    });
    playbackDiagChatBubbleMotion({
      id: "r0",
      phase: "frame",
      y: 0,
      opacity: 1,
      deltaY: 40,
      shouldAnimate: true,
    });
    const bundle = getPlaybackDiagBundle();
    expect(bundle.chatBubbleMotion.count).toBeGreaterThanOrEqual(3);
    expect(bundle.chatBubbleMotion.jumps).toBeGreaterThanOrEqual(1);
    expect(bundle.chatBubbleMotion.maxAbsDeltaY).toBeGreaterThanOrEqual(40);
    expect(bundle.chatBubbleMotion.ids).toContain("r0");

    playbackDiagClear();
    resetQaDiagGateForTests();
    playbackDiagChatBubbleMotion({
      id: "r1",
      phase: "animate-start",
      y: 14,
      opacity: 0,
      shouldAnimate: true,
    });
    expect(getPlaybackDiagBundle().chatBubbleMotion.count).toBe(0);
  });

  it("records type-in progress and asserts PASS", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagTypeInStart("site-pilot", 20);
    for (let i = 1; i <= 20; i++) playbackDiagTypeInProgress(i);
    playbackDiagTypeInEnd(true);

    const bundle = getPlaybackDiagBundle();
    expect(bundle.typeIn.starts).toBe(1);
    expect(bundle.typeIn.ends).toBe(1);
    expect(bundle.typeIn.skips).toBe(0);
    expect(bundle.typeIn.progressSamples.length).toBeGreaterThanOrEqual(2);

    const assert = assertPlaybackTypeIn({ minSamples: 2, minChars: 8 });
    expect(assert.pass).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  it("FAIL when type-in was skipped", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagTypeInSkip("site-pilot", "prefilled match");
    const assert = assertPlaybackTypeIn();
    expect(assert.pass).toBe(false);
    expect(assert.reason).toMatch(/type-in-skip/);
  });

  it("counts step / retreat events", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagLog("step-forward", "test");
    playbackDiagLog("step-back", "test");
    playbackDiagLog("retreat-sync", "home:sarah-query-submit", {
      beatId: "agentic-home",
    });
    const bundle = getPlaybackDiagBundle();
    expect(bundle.step.forwards).toBe(1);
    expect(bundle.step.backs).toBe(1);
    expect(bundle.step.retreatSyncs).toBe(1);
  });

  it("emits beat / cursor / scroll / click on step+retreat paths", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagBeat({
      phase: "enter",
      beatId: "traditional-plp",
      beatKind: "tab-landing",
      mode: "traditional",
      screenBefore: "plp",
      screenAfter: "plp",
    });
    playbackDiagTarget({
      selector: "[data-studio-wishlist-id]",
      found: true,
      beatId: "traditional-plp",
    });
    playbackDiagCursor({
      action: "park",
      parked: true,
      parkReason: "journey-park",
      beatId: "traditional-plp",
      graphicState: "default",
      samples: 3,
    });
    playbackDiagScroll({
      host: "div.studio-scroll--prototype",
      beforeTop: 120,
      afterTop: 40,
      intoViewRequested: true,
      intoViewDone: true,
      retreat: true,
      beatId: "book-step2-date",
    });
    playbackDiagClick({
      ok: true,
      selector: "[data-studio-action=book-step-1-continue]",
      beatId: "choose-location",
    });
    playbackDiagSkip({
      reason: "dwell-only",
      beatId: "book-step2",
    });
    playbackDiagLog("step-forward", "Studio nav — Step forward", {
      beatId: "traditional-plp",
    });
    playbackDiagLog("step-back", "Studio nav — Step back", {
      beatId: "book-step2-date",
    });

    const bundle = getPlaybackDiagBundle();
    expect(bundle.cursor.parks).toBe(1);
    expect(bundle.cursor.lastParkReason).toBe("journey-park");
    expect(bundle.scroll.retreatIntoView).toBe(1);
    expect(bundle.click.ok).toBe(1);
    expect(bundle.skip.count).toBe(1);
    expect(bundle.step.forwards).toBe(1);
    expect(bundle.step.backs).toBe(1);
    expect(
      spy.mock.calls.some(
        (c) => c[0] === "[PLAYBACK_DIAG]" && String(c[1]).includes("cursor")
      )
    ).toBe(true);
    expect(
      spy.mock.calls.some(
        (c) =>
          c[0] === "[PLAYBACK_DIAG]" &&
          String(c[2]?.detail ?? "").includes("PARKED")
      )
    ).toBe(true);
  });

  it("assertPlayEndedAtStart requires play-end + start beat", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubGlobal("window", {
      __protoStudioState: () => ({
        beatId: "traditional-plp",
        isPlaying: false,
        isOnAir: false,
      }),
    });
    vi.stubGlobal("location", {
      search: "?project=boots-pharmacy&screen=plp&cjm=on",
    });

    expect(
      assertPlaybackPlayEndedAtStart({
        startBeatId: "traditional-plp",
        startScreenId: "plp",
      }).pass
    ).toBe(false);

    playbackDiagPlayEnd({
      fromBeatId: "appointment-details",
      toBeatId: "traditional-plp",
    });
    playbackDiagJourneyReset({
      fromBeatId: "appointment-details",
      startBeatId: "traditional-plp",
      startScreenId: "plp",
    });
    const assert = assertPlaybackPlayEndedAtStart({
      startBeatId: "traditional-plp",
      startScreenId: "plp",
    });
    expect(assert.pass).toBe(true);
    expect(getPlaybackDiagBundle().playEnd.count).toBe(1);
    expect(getPlaybackDiagBundle().journeyReset.count).toBe(1);
  });

  it("hub-nav records reason + stack for PO forensics", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    playbackDiagHubNav({
      reason: "user-nav-hub",
      source: "App.openHub",
    });
    const bundle = getPlaybackDiagBundle();
    expect(bundle.hubNav.count).toBe(1);
    expect(bundle.hubNav.last?.hubReason).toBe("user-nav-hub");
    expect(bundle.hubNav.last?.hubStack).toMatch(/hub-nav:user-nav-hub/);
    expect(bundle.hubNav.last?.screenAfter).toBe("hub");
    expect(warn).toHaveBeenCalled();
    expect(info).toHaveBeenCalled();
  });

  it("screen-enter + nav-cross track blink forensics", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagScreenEnter({
      screenId: "book-step-2",
      remountCount: 1,
      renderCount: 2,
      createdRoot: false,
      opacity: 1,
      visibility: "visible",
      motionPresence: false,
    });
    playbackDiagNavCross({
      sameTab: true,
      instant: true,
      navCross: false,
      screenBefore: "book-step-2",
      screenAfter: "book-step-2",
    });
    playbackDiagNavCross({
      sameTab: false,
      instant: false,
      navCross: true,
      screenBefore: "book-step-2",
      screenAfter: "book-step-3",
    });
    const bundle = getPlaybackDiagBundle();
    expect(bundle.screenEnter.count).toBe(1);
    expect(bundle.screenEnter.last?.motionPresence).toBe(false);
    expect(bundle.navCross.count).toBe(2);
    expect(bundle.navCross.ran).toBe(1);
    expect(bundle.navCross.skipped).toBe(1);
  });
});
