import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertPlaybackPlayEndedAtEnd,
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
/** @vitest-environment happy-dom */

import {
  openQaDiagGate,
  resetQaDiagGateForTests,
} from "@/app/shell/qaDiagGate";
import { setPlaybackTimingMode } from "@/app/shell/playbackTiming";

describe("playbackDiag", () => {
  beforeEach(() => {
    // Console emit is gated — open for suites that assert [PLAYBACK_DIAG] noise.
    openQaDiagGate({ reason: "playbackDiag-test" });
  });

  afterEach(() => {
    playbackDiagClear();
    resetQaDiagGateForTests();
    setPlaybackTimingMode("normal");
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

  it("samples bubble frames / routine TRACE — no per-rAF console or overlay flood", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagChatBubbleMotion({
      id: "r2",
      phase: "animate-start",
      y: 14,
      opacity: 0,
      shouldAnimate: true,
    });
    for (let i = 0; i < 12; i++) {
      playbackDiagChatBubbleMotion({
        id: "r2",
        phase: "frame",
        y: 12 - i,
        opacity: 0.2,
        deltaY: 1,
        shouldAnimate: true,
        trace: { scrollLock: true, deltaScrollTop: 2, cameraTag: "pull-up-raf" },
      });
    }
    for (let i = 0; i < 6; i++) {
      playbackDiagChatBubbleMotion({
        id: "r2",
        phase: "trace",
        note: "camera:pull-up-co-travel",
        shouldAnimate: true,
        trace: {
          scrollLock: true,
          cameraTag: "pull-up-co-travel",
          clearPx: 20,
          underComposer: false,
        },
      });
    }
    const bundle = getPlaybackDiagBundle();
    // Sparse frames (every 4th + first) — not 12.
    expect(bundle.chatBubbleMotion.count).toBeLessThan(12);
    expect(bundle.chatBubbleMotion.count).toBeGreaterThanOrEqual(4);
    // Routine TRACE must not flood the event ring / QA summarize path.
    const traceEvents = bundle.events.filter(
      (e) =>
        e.kind === "chat-bubble-motion" && e.bubble?.phase === "trace"
    );
    expect(traceEvents.length).toBeLessThan(3);
    // Console: milestone start only — not every frame/routine TRACE.
    const bubbleConsole = spy.mock.calls.filter(
      (c) => c[1] === "chat-bubble-motion"
    );
    expect(bubbleConsole.length).toBeLessThan(4);
  });

  it("allows smooth high-speed camera co-travel", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const events = [22, 24, 23, 20].map((velocity, index) =>
      playbackDiagChatBubbleMotion({
        id: "r1",
        phase: "frame",
        y: 8 - index,
        deltaY: -velocity,
        trace: { scrollLock: true, deltaScrollTop: velocity },
      })
    );
    expect(events.every((event) => !event?.bubble?.jump && !event?.bubble?.chop)).toBe(true);
  });

  it("does not compare the first animation frame with the mount milestone", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagChatBubbleMotion({
      id: "r-first",
      phase: "mount",
      y: 14,
      deltaY: 0,
      trace: { scrollLock: true, deltaScrollTop: 0 },
    });
    playbackDiagChatBubbleMotion({
      id: "r-first",
      phase: "animate-start",
      y: 14,
      deltaY: 0,
      trace: { scrollLock: true, deltaScrollTop: 0 },
    });
    const firstFrame = playbackDiagChatBubbleMotion({
      id: "r-first",
      phase: "frame",
      y: 12,
      deltaY: -15.59,
      trace: { scrollLock: true, deltaScrollTop: 15.59 },
    });

    expect(firstFrame?.bubble?.jump).toBe(false);
    expect(firstFrame?.bubble?.chop).toBe(false);
  });

  it("flags a discontinuous co-travel step", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    for (const velocity of [4, 5]) {
      playbackDiagChatBubbleMotion({
        id: "r2", phase: "frame", y: 8, deltaY: -velocity,
        trace: { scrollLock: true, deltaScrollTop: velocity },
      });
    }
    const event = playbackDiagChatBubbleMotion({
      id: "r2",
      phase: "frame",
      y: 7,
      deltaY: -32,
      trace: { scrollLock: true, deltaScrollTop: 32 },
    });

    expect(event?.bubble?.jump).toBe(true);
    expect(event?.bubble?.jumpReason).toMatch(/layout ΔΔY=-27/);
    expect(event?.bubble?.chop).toBe(true);
    expect(event?.bubble?.chopReason).toMatch(/scrollTop ΔΔ=27/);
    expect(getPlaybackDiagBundle().chatBubbleMotion.jumps).toBe(1);
    expect(getPlaybackDiagBundle().chatBubbleMotion.chops).toBe(1);
  });

  it("keeps compressed fast-motion samples diagnostic-only", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const handoff = vi.fn();
    (window as Window & { __studioBeginQaFailHandoff?: typeof handoff })
      .__studioBeginQaFailHandoff = handoff;
    setPlaybackTimingMode("fast");
    for (const velocity of [4, 5]) {
      playbackDiagChatBubbleMotion({
        id: "fast-r2", phase: "frame", y: 8, deltaY: -velocity,
        trace: { scrollLock: true, deltaScrollTop: velocity },
      });
    }
    playbackDiagChatBubbleMotion({
      id: "fast-r2", phase: "frame", y: 7, deltaY: -32,
      trace: { scrollLock: true, deltaScrollTop: 32 },
    });
    expect(handoff).not.toHaveBeenCalled();
  });

  it("keeps bubble jump/chop diagnostic-only while prove-mode is armed", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const handoff = vi.fn();
    (window as Window & { __studioBeginQaFailHandoff?: typeof handoff })
      .__studioBeginQaFailHandoff = handoff;
    const { beginQaProveMode, endQaProveMode } = await import(
      "@/app/shell/agent-testing/agentTestingPresence"
    );
    setPlaybackTimingMode("normal");
    beginQaProveMode("unit-prove");
    try {
      playbackDiagChatBubbleMotion({
        id: "prove-r1",
        phase: "frame",
        y: 8,
        deltaY: -4,
        trace: { scrollLock: true, deltaScrollTop: 4 },
      });
      playbackDiagChatBubbleMotion({
        id: "prove-r1",
        phase: "frame",
        y: 7,
        deltaY: -32,
        trace: { scrollLock: true, deltaScrollTop: 32 },
      });
      expect(handoff).not.toHaveBeenCalled();
    } finally {
      endQaProveMode();
    }
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
    // Sparse samples only (not one per char) — dump smell was samples≈249.
    expect(bundle.typeIn.progressSamples.length).toBeLessThan(10);
    // HARD: no per-char (or throttled) type-in-progress events — samples in-memory only.
    expect(bundle.events.filter((e) => e.kind === "type-in-progress")).toHaveLength(
      0
    );
    expect(bundle.events.filter((e) => e.kind === "type-in-start")).toHaveLength(1);
    expect(bundle.events.filter((e) => e.kind === "type-in-end")).toHaveLength(1);

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
    // Lean console: healthy park / step ticks stay out of DevTools.
    expect(
      spy.mock.calls.some(
        (c) =>
          c[0] === "[PLAYBACK_DIAG]" &&
          String(c[2]?.detail ?? "").includes("PARKED")
      )
    ).toBe(false);
    expect(
      spy.mock.calls.some(
        (c) => c[0] === "[PLAYBACK_DIAG]" && c[1] === "step-forward"
      )
    ).toBe(false);
    // Keep real product signals: click + skip still emit.
    expect(
      spy.mock.calls.some(
        (c) => c[0] === "[PLAYBACK_DIAG]" && c[1] === "click"
      )
    ).toBe(true);
    expect(
      spy.mock.calls.some((c) => c[0] === "[PLAYBACK_DIAG]" && c[1] === "skip")
    ).toBe(true);
  });

  it("keeps durable click.ok tallies across event rotation", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    for (let i = 0; i < 3; i++) {
      playbackDiagClick({
        ok: true,
        selector: `[data-studio-action=cta-${i}]`,
      });
    }
    playbackDiagClick({
      ok: false,
      selector: "[data-studio-action=miss]",
    });
    expect(getPlaybackDiagBundle().click.ok).toBe(3);
    expect(getPlaybackDiagBundle().click.fail).toBe(1);
    // Flood ring past MAX_EVENTS — tallies must not drop.
    for (let i = 0; i < 450; i++) {
      playbackDiagLog("info", `noise-${i}`);
    }
    expect(getPlaybackDiagBundle().click.ok).toBe(3);
    expect(getPlaybackDiagBundle().click.fail).toBe(1);
  });

  it("assertPlayEndedAtEnd requires play-end + finale beat (no rewind)", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubGlobal("window", {
      __protoStudioState: () => ({
        beatId: "appointment-details",
        counter: "13 / 13",
        isPlaying: false,
        isOnAir: false,
      }),
    });
    vi.stubGlobal("location", {
      search: "?project=boots-pharmacy&screen=appointment-details&cjm=on",
    });

    expect(
      assertPlaybackPlayEndedAtEnd({
        endBeatId: "appointment-details",
        endScreenId: "appointment-details",
        startBeatId: "traditional-plp",
      }).pass
    ).toBe(false);

    playbackDiagPlayEnd({
      fromBeatId: "appointment-details",
      toBeatId: "appointment-details",
      endScreenId: "appointment-details",
      detail: "play-end → stay at journey end",
    });
    const assert = assertPlaybackPlayEndedAtEnd({
      endBeatId: "appointment-details",
      endScreenId: "appointment-details",
      startBeatId: "traditional-plp",
    });
    expect(assert.pass).toBe(true);
    expect(getPlaybackDiagBundle().playEnd.count).toBe(1);
    // Play-end must not emit journey-reset (manual Jump-to-start still does).
    expect(getPlaybackDiagBundle().journeyReset.count).toBe(0);
  });

  it("assertPlayEndedAtEnd fails when rewound to journey start", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubGlobal("window", {
      __protoStudioState: () => ({
        beatId: "traditional-plp",
        counter: "1 / 13",
        isPlaying: false,
        isOnAir: false,
      }),
    });
    vi.stubGlobal("location", {
      search: "?project=boots-pharmacy&screen=plp&cjm=on",
    });
    playbackDiagPlayEnd({
      fromBeatId: "appointment-details",
      toBeatId: "traditional-plp",
    });
    const assert = assertPlaybackPlayEndedAtEnd({
      endBeatId: "appointment-details",
      endScreenId: "appointment-details",
      startBeatId: "traditional-plp",
    });
    expect(assert.pass).toBe(false);
    expect(assert.reason).toMatch(/expected end|rewound to start|counter=/);
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

  it("keeps type-in lifecycle totals after the diagnostic ring rotates", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagTypeInStart("site-pilot", 32);
    playbackDiagTypeInProgress(16);
    playbackDiagTypeInProgress(32);
    playbackDiagTypeInEnd(true);
    for (let i = 0; i < 450; i += 1) {
      playbackDiagLog({ kind: "beat", beatId: `rotation-${i}` });
    }
    const bundle = getPlaybackDiagBundle();
    expect(bundle.typeIn.starts).toBe(1);
    expect(bundle.typeIn.ends).toBe(1);
    expect(bundle.typeIn.skips).toBe(0);
    expect(bundle.typeIn.progressSamples.length).toBeGreaterThan(0);
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
