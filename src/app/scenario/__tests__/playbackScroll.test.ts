/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  animateScrollTo,
  beginDemoTargetPageScroll,
  cancelPlaybackScroll,
  computeScrollTopForElement,
  easeInOutCubic,
  getPrototypeScrollRoot,
  isPrototypePageScrollLocked,
  msUntilPostClickCameraHoldClears,
  noteCameraHoldInteraction,
  POST_CLICK_CAMERA_HOLD_MS,
  readScrollPaddingBottom,
  resetChatCameraTrackerForTests,
  resetPlaybackCameraSessionForTests,
  resetPostClickCameraHoldForTests,
  scrollCameraToHostEnd,
  scrollCameraToOrigin,
  setCameraBeatDwellActive,
  setPlaybackCameraSessionActive,
  shouldBlindOriginResetOnScreenEnter,
  shouldYieldChatAutoCamera,
  waitForPlaybackLayoutFrames,
} from "@/app/scenario/playbackScroll";
import { motionEaseInOutProgress } from "@/uxds/motion";

function mockRect(top: number, height: number) {
  return {
    top,
    left: 0,
    bottom: top + height,
    right: 300,
    width: 300,
    height,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
}

function mockScrollEl(opts: {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
  top?: number;
}) {
  return {
    scrollTop: opts.scrollTop,
    clientHeight: opts.clientHeight,
    scrollHeight: opts.scrollHeight,
    getBoundingClientRect: () => mockRect(opts.top ?? 0, opts.clientHeight),
  } as unknown as HTMLElement;
}

function mockTarget(top: number, height: number) {
  return {
    getBoundingClientRect: () => mockRect(top, height),
  } as unknown as HTMLElement;
}

describe("easeInOutCubic", () => {
  it("returns 0 at start and 1 at end", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it("is monotonic between endpoints", () => {
    const mid = easeInOutCubic(0.5);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(easeInOutCubic(0.25)).toBeLessThan(mid);
    expect(easeInOutCubic(0.75)).toBeGreaterThan(mid);
  });
});

describe("computeScrollTopForElement", () => {
  it("centers target in scroll container", () => {
    const scrollEl = mockScrollEl({
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 1200,
      top: 100,
    });
    const target = mockTarget(500, 80);

    const top = computeScrollTopForElement(scrollEl, target, "center");
    expect(top).toBe(240);
  });

  it("aligns start with padding", () => {
    const scrollEl = mockScrollEl({
      scrollTop: 200,
      clientHeight: 400,
      scrollHeight: 1200,
      top: 50,
    });
    const target = mockTarget(300, 60);

    const top = computeScrollTopForElement(scrollEl, target, "start", 24);
    expect(top).toBe(426);
  });

  it("keeps scroll position when nearest and already visible", () => {
    const scrollEl = mockScrollEl({
      scrollTop: 100,
      clientHeight: 400,
      scrollHeight: 1200,
      top: 0,
    });
    const target = mockTarget(150, 40);

    const top = computeScrollTopForElement(scrollEl, target, "nearest", 16);
    expect(top).toBe(100);
  });

  it("scrolls down for nearest when target is below viewport", () => {
    const scrollEl = mockScrollEl({
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 1200,
      top: 0,
    });
    const target = mockTarget(450, 80);

    const top = computeScrollTopForElement(scrollEl, target, "nearest", 16);
    expect(top).toBe(146);
  });

  it("clamps to max scroll", () => {
    const scrollEl = mockScrollEl({
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 500,
      top: 0,
    });
    const target = mockTarget(900, 80);

    const top = computeScrollTopForElement(scrollEl, target, "end");
    expect(top).toBe(100);
  });

  it("honors CSS scroll-padding-bottom (Chat composer dock) on end align", () => {
    const scrollEl = mockScrollEl({
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 2000,
      top: 0,
    });
    const target = mockTarget(450, 80);
    const spy = vi.spyOn(window, "getComputedStyle").mockReturnValue({
      scrollPaddingBottom: "220px",
    } as CSSStyleDeclaration);

    try {
      // end: targetBottom(530) - clientHeight(400) + padBottom(220) = 350
      expect(computeScrollTopForElement(scrollEl, target, "end")).toBe(350);
      expect(readScrollPaddingBottom(scrollEl)).toBe(220);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("animateScrollTo", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("eases scrollTop over multiple frames", async () => {
    const scrollEl = {
      scrollTop: 0,
      scrollHeight: 2000,
      clientHeight: 400,
      classList: { contains: () => false },
      dataset: {},
    } as unknown as HTMLElement;

    let rafCallback: FrameRequestCallback | null = null;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    let now = 0;
    vi.stubGlobal("performance", { now: () => now });

    const promise = animateScrollTo(scrollEl, 800, { durationMs: 400 });
    expect(rafCallback).not.toBeNull();

    now = 0;
    rafCallback!(0);
    const midEarly = scrollEl.scrollTop;
    expect(midEarly).toBeGreaterThanOrEqual(0);
    expect(midEarly).toBeLessThan(800);

    now = 200;
    rafCallback!(200);
    expect(scrollEl.scrollTop).toBeGreaterThan(midEarly);
    expect(scrollEl.scrollTop).toBeLessThan(800);

    now = 400;
    rafCallback!(400);
    await promise;
    expect(scrollEl.scrollTop).toBe(800);
  });

  it("uses the bubble ease-in-out curve for chat co-travel", async () => {
    expect(motionEaseInOutProgress(0.25)).toBeCloseTo(0.12916, 4);
    const scrollEl = {
      scrollTop: 0,
      scrollHeight: 2000,
      clientHeight: 400,
      classList: { contains: () => false },
      dataset: {},
    } as unknown as HTMLElement;

    let rafCallback: FrameRequestCallback | null = null;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    let now = 0;
    vi.stubGlobal("performance", { now: () => now });

    const promise = animateScrollTo(scrollEl, 800, {
      durationMs: 400,
      coTravel: true,
    });

    now = 100;
    rafCallback!(100);
    expect(scrollEl.scrollTop).toBeCloseTo(
      800 * motionEaseInOutProgress(0.25),
      3
    );

    now = 400;
    rafCallback!(400);
    await promise;
    expect(scrollEl.scrollTop).toBe(800);
  });

  it("co-travels when Chat scroll range appears after animation start", async () => {
    const scrollEl = {
      scrollTop: 0,
      scrollHeight: 400,
      clientHeight: 400,
      classList: { contains: () => false },
      dataset: {},
    } as unknown as HTMLElement;

    let rafCallback: FrameRequestCallback | null = null;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    let now = 0;
    vi.stubGlobal("performance", { now: () => now });

    const resolveTargetTop = () =>
      Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
    const promise = animateScrollTo(scrollEl, resolveTargetTop(), {
      durationMs: 400,
      coTravel: true,
      resolveTargetTop,
    });

    // Reply/helpful content creates a 447px range after the camera was armed.
    scrollEl.scrollHeight = 847;
    now = 80;
    rafCallback!(80);
    expect(scrollEl.scrollTop).toBe(0); // continuity-preserving re-anchor

    now = 160;
    rafCallback!(160);
    expect(scrollEl.scrollTop).toBeGreaterThan(0);
    expect(scrollEl.scrollTop).toBeLessThan(447);

    now = 400;
    rafCallback!(400);
    await promise;
    expect(scrollEl.scrollTop).toBe(447);
  });

  it("settles a dynamic co-travel promise when a new camera replaces its rAF", async () => {
    const scrollEl = {
      scrollTop: 0,
      scrollHeight: 400,
      clientHeight: 400,
      classList: { contains: () => false },
      dataset: {},
    } as unknown as HTMLElement;

    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 17));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("performance", { now: () => 0 });

    const resolveTargetTop = () =>
      Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
    let settled = false;
    const coTravel = animateScrollTo(scrollEl, 0, {
      durationMs: 400,
      coTravel: true,
      resolveTargetTop,
    }).then(() => {
      settled = true;
    });

    cancelPlaybackScroll("replace");
    await coTravel;

    expect(settled).toBe(true);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(17);
  });

  it("settles the pre-camera layout wait when rAF is lost", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 23));

    let settled = false;
    const wait = waitForPlaybackLayoutFrames(2, 120).then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(119);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await wait;
    expect(settled).toBe(true);
    vi.useRealTimers();
  });

  it("animates even when prefers-reduced-motion is set", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true, addEventListener: () => {} })
    );

    const scrollEl = {
      scrollTop: 0,
      scrollHeight: 1200,
      clientHeight: 400,
      classList: { contains: () => false },
      dataset: {},
    } as unknown as HTMLElement;

    let rafCallback: FrameRequestCallback | null = null;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    let now = 0;
    vi.stubGlobal("performance", { now: () => now });

    const promise = animateScrollTo(scrollEl, 500, { durationMs: 300 });

    now = 150;
    rafCallback!(150);
    expect(scrollEl.scrollTop).toBeGreaterThan(0);
    expect(scrollEl.scrollTop).toBeLessThan(500);

    now = 300;
    rafCallback!(300);
    await promise;
    expect(scrollEl.scrollTop).toBe(500);
  });
});

describe("getPrototypeScrollRoot", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("prefers active .chat__column when outer prototype cannot scroll", () => {
    window.history.replaceState({}, "", "/?screen=chat");
    document.body.innerHTML = `
      <div class="studio-scroll--prototype" style="height:400px;overflow:hidden">
        <div data-studio-react-screen="chat">
          <div class="chat__column" style="height:400px;overflow:auto">
            <button id="bubble">CTA</button>
            <div style="height:1200px"></div>
          </div>
        </div>
      </div>
    `;
    const proto = document.querySelector<HTMLElement>(".studio-scroll--prototype")!;
    Object.defineProperty(proto, "scrollHeight", { value: 400, configurable: true });
    Object.defineProperty(proto, "clientHeight", { value: 400, configurable: true });
    const column = document.querySelector<HTMLElement>(".chat__column")!;
    Object.defineProperty(column, "scrollHeight", { value: 1600, configurable: true });
    Object.defineProperty(column, "clientHeight", { value: 400, configurable: true });
    // jsdom getClientRects is empty — stub active host check
    column.getClientRects = () =>
      [{ width: 400, height: 400 }] as unknown as DOMRectList;

    const bubble = document.getElementById("bubble")!;
    expect(getPrototypeScrollRoot(bubble)).toBe(column);
    expect(getPrototypeScrollRoot()).toBe(column);
  });

  it("keeps .studio-scroll--prototype when chat column is not active", () => {
    window.history.replaceState({}, "", "/?screen=plp");
    document.body.innerHTML = `
      <div class="studio-scroll--prototype" style="height:400px;overflow:auto">
        <div data-studio-react-screen="chat" style="display:none">
          <div class="chat__column"></div>
        </div>
        <div id="plp">PLP</div>
      </div>
    `;
    const proto = document.querySelector<HTMLElement>(".studio-scroll--prototype")!;
    Object.defineProperty(proto, "scrollHeight", { value: 2000, configurable: true });
    Object.defineProperty(proto, "clientHeight", { value: 400, configurable: true });
    const plp = document.getElementById("plp")!;
    expect(getPrototypeScrollRoot(plp)).toBe(proto);
  });

  it("prefers a nested modal scroll region for lower interactive targets", () => {
    document.body.innerHTML = `
      <div class="studio-scroll--prototype" style="height:400px;overflow:auto">
        <div class="studio-avail-scrim">
          <div class="proto-avail-card">
            <div id="store-list" style="height:240px;overflow-y:auto">
              <button id="lower-store">Choose Location</button>
            </div>
          </div>
        </div>
      </div>
    `;
    const list = document.getElementById("store-list")!;
    Object.defineProperty(list, "scrollHeight", { value: 900, configurable: true });
    Object.defineProperty(list, "clientHeight", { value: 240, configurable: true });

    expect(getPrototypeScrollRoot(document.getElementById("lower-store"))).toBe(list);
  });

  it("does not prefer chat column when ?screen= is a non-chat page", () => {
    window.history.replaceState({}, "", "/?screen=book-step-3");
    document.body.innerHTML = `
      <div class="studio-scroll--prototype" style="height:400px;overflow:hidden">
        <div data-studio-react-screen="chat">
          <div class="chat__column" style="height:400px;overflow:auto"></div>
        </div>
        <div id="confirm">Confirm</div>
      </div>
    `;
    const proto = document.querySelector<HTMLElement>(".studio-scroll--prototype")!;
    Object.defineProperty(proto, "scrollHeight", { value: 400, configurable: true });
    Object.defineProperty(proto, "clientHeight", { value: 400, configurable: true });
    const column = document.querySelector<HTMLElement>(".chat__column")!;
    column.getClientRects = () =>
      [{ width: 400, height: 400 }] as unknown as DOMRectList;
    Object.defineProperty(column, "scrollHeight", { value: 1600, configurable: true });
    Object.defineProperty(column, "clientHeight", { value: 400, configurable: true });
    expect(getPrototypeScrollRoot(document.getElementById("confirm"))).toBe(proto);
  });
});

describe("prototype page scroll lock", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("skips animateScrollTo when scroll root is popup-locked", async () => {
    const scrollEl = {
      scrollTop: 0,
      scrollHeight: 1200,
      clientHeight: 400,
      classList: { contains: (name: string) => name === "studio-scroll--locked" },
      dataset: {},
    } as unknown as HTMLElement;

    await animateScrollTo(scrollEl, 500);
    expect(scrollEl.scrollTop).toBe(0);
  });

  it("still animates when scroll root is journey-locked (user lock only)", async () => {
    const scrollEl = {
      scrollTop: 0,
      scrollHeight: 1200,
      clientHeight: 400,
      classList: {
        contains: (name: string) => name === "studio-scroll--journey-locked",
      },
      dataset: {},
    } as unknown as HTMLElement;

    let rafCallback: FrameRequestCallback | null = null;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    let now = 0;
    vi.stubGlobal("performance", { now: () => now });

    const promise = animateScrollTo(scrollEl, 500, { durationMs: 300 });
    now = 300;
    rafCallback!(300);
    await promise;
    expect(scrollEl.scrollTop).toBe(500);
  });

  it("skips beginDemoTargetPageScroll for overlay targets", async () => {
    const scrollEl = {
      scrollTop: 0,
      scrollHeight: 1200,
      clientHeight: 400,
      classList: { contains: () => false },
      dataset: {},
      getBoundingClientRect: () => mockRect(0, 400),
    } as unknown as HTMLElement;

    const target = {
      isConnected: true,
      getBoundingClientRect: () => mockRect(200, 40),
      closest: () => ({}),
    } as unknown as HTMLElement;

    const result = await beginDemoTargetPageScroll(target, { scrollEl });
    expect(result.durationMs).toBe(0);
    expect(isPrototypePageScrollLocked(scrollEl)).toBe(false);
  });
});

describe("post-click camera hold", () => {
  afterEach(() => {
    resetPostClickCameraHoldForTests();
    resetPlaybackCameraSessionForTests();
    vi.useRealTimers();
  });

  it("arms hold and defers host-end until clear", () => {
    vi.useFakeTimers();
    noteCameraHoldInteraction("test");
    expect(msUntilPostClickCameraHoldClears()).toBe(POST_CLICK_CAMERA_HOLD_MS);

    const el = {
      scrollTop: 0,
      scrollHeight: 2000,
      clientHeight: 400,
      classList: { contains: () => false },
      dataset: {},
      tagName: "DIV",
      id: "",
      className: "",
      getBoundingClientRect: () => mockRect(0, 400),
    } as unknown as HTMLElement;

    scrollCameraToHostEnd(el, { instant: true, reason: "hold-test" });
    expect(el.scrollTop).toBe(0);

    vi.advanceTimersByTime(POST_CLICK_CAMERA_HOLD_MS + 10);
    expect(el.scrollTop).toBe(1600);
  });

  it("skipHold bypasses defer", () => {
    noteCameraHoldInteraction("test");
    const el = {
      scrollTop: 0,
      scrollHeight: 2000,
      clientHeight: 400,
      classList: { contains: () => false },
      dataset: {},
      tagName: "DIV",
      id: "",
      className: "",
      getBoundingClientRect: () => mockRect(0, 400),
    } as unknown as HTMLElement;

    scrollCameraToHostEnd(el, {
      instant: true,
      reason: "skip",
      skipHold: true,
    });
    expect(el.scrollTop).toBe(1600);
  });
});

describe("screen-enter camera policy", () => {
  afterEach(() => {
    resetPostClickCameraHoldForTests();
    resetPlaybackCameraSessionForTests();
  });

  it("blocks blind origin while playback camera session is active", () => {
    setPlaybackCameraSessionActive(true);
    expect(shouldBlindOriginResetOnScreenEnter()).toBe(false);

    const el = {
      scrollTop: 400,
      scrollLeft: 0,
      scrollHeight: 2000,
      clientHeight: 400,
      classList: { contains: () => false },
      dataset: {},
      tagName: "DIV",
      id: "",
      className: "",
      getBoundingClientRect: () => mockRect(0, 400),
    } as unknown as HTMLElement;

    scrollCameraToOrigin(el, { instant: true, reason: "tab-enter" });
    expect(el.scrollTop).toBe(400);

    scrollCameraToOrigin(el, {
      instant: true,
      force: true,
      reason: "jump-to-start",
      skipHold: true,
    });
    expect(el.scrollTop).toBe(0);
  });

  it("blocks blind origin while post-click hold is armed", () => {
    noteCameraHoldInteraction("test");
    expect(shouldBlindOriginResetOnScreenEnter()).toBe(false);

    const el = {
      scrollTop: 220,
      scrollLeft: 0,
      scrollHeight: 2000,
      clientHeight: 400,
      classList: { contains: () => false },
      dataset: {},
      tagName: "DIV",
      id: "",
      className: "",
      getBoundingClientRect: () => mockRect(0, 400),
    } as unknown as HTMLElement;

    scrollCameraToOrigin(el, { instant: true });
    expect(el.scrollTop).toBe(220);
  });

  it("allows blind origin when idle browse", () => {
    expect(shouldBlindOriginResetOnScreenEnter()).toBe(true);
    const el = {
      scrollTop: 90,
      scrollLeft: 0,
      scrollHeight: 2000,
      clientHeight: 400,
      classList: { contains: () => false },
      dataset: {},
      tagName: "DIV",
      id: "",
      className: "",
      getBoundingClientRect: () => mockRect(0, 400),
    } as unknown as HTMLElement;

    scrollCameraToOrigin(el, { instant: true });
    expect(el.scrollTop).toBe(0);
  });
});

// Pins TRADITIONAL_CJM_UX_2026-07-21.md fix: routine "page land = top" resets
// (wire's forced screen-change reset) must not yank a beat that already owns
// the camera — Reserve→confirm (camera-beat dwell) / history / details
// (in-flight reveal ease) forward lands were bouncing origin↔target
// (scroll-reversal). `force: true` alone (jump-to-start / go-home / wipe)
// must keep overriding everything — only `yieldToActiveCameraWork` yields.
describe("scrollCameraToOrigin — yieldToActiveCameraWork (forward-land fix)", () => {
  afterEach(() => {
    resetChatCameraTrackerForTests();
    resetPlaybackCameraSessionForTests();
    resetPostClickCameraHoldForTests();
    vi.unstubAllGlobals();
  });

  function fullScrollEl(scrollTop: number) {
    return {
      scrollTop,
      scrollLeft: 0,
      scrollHeight: 2000,
      clientHeight: 400,
      classList: { contains: () => false },
      dataset: {},
      tagName: "DIV",
      id: "",
      className: "",
      getBoundingClientRect: () => mockRect(0, 400),
    } as unknown as HTMLElement;
  }

  it("does not yank origin while a camera-beat dwell owns the land (book-step-3 confirm)", () => {
    setCameraBeatDwellActive(true);
    const el = fullScrollEl(640);

    scrollCameraToOrigin(el, {
      instant: true,
      force: true,
      yieldToActiveCameraWork: true,
      reason: "resetPrototypeScroll",
    });
    expect(el.scrollTop).toBe(640);

    setCameraBeatDwellActive(false);
    scrollCameraToOrigin(el, {
      instant: true,
      force: true,
      yieldToActiveCameraWork: true,
      reason: "resetPrototypeScroll",
    });
    expect(el.scrollTop).toBe(0);
  });

  it("does not yank origin while a beat's own reveal ease is mid-flight (history/details)", async () => {
    const el = fullScrollEl(0);

    let rafCallback: FrameRequestCallback | null = null;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    let now = 0;
    vi.stubGlobal("performance", { now: () => now });

    const promise = animateScrollTo(el, 800, { durationMs: 400 });
    now = 200;
    rafCallback!(200);
    const midFlightTop = el.scrollTop;
    expect(midFlightTop).toBeGreaterThan(0);
    expect(midFlightTop).toBeLessThan(800);

    scrollCameraToOrigin(el, {
      instant: true,
      force: true,
      yieldToActiveCameraWork: true,
      reason: "resetPrototypeScroll",
    });
    expect(el.scrollTop).toBe(midFlightTop);

    now = 400;
    rafCallback!(400);
    await promise;
    expect(el.scrollTop).toBe(800);
  });

  it("still forces the origin snap when no beat owns the camera (idle land)", () => {
    const el = fullScrollEl(640);
    scrollCameraToOrigin(el, {
      instant: true,
      force: true,
      yieldToActiveCameraWork: true,
      reason: "resetPrototypeScroll",
    });
    expect(el.scrollTop).toBe(0);
  });

  it("plain force (no yieldToActiveCameraWork) still overrides dwell — jump-to-start / go-home unaffected", () => {
    setCameraBeatDwellActive(true);
    const el = fullScrollEl(640);
    scrollCameraToOrigin(el, {
      instant: true,
      force: true,
      reason: "jump-to-start",
    });
    expect(el.scrollTop).toBe(0);
  });
});

describe("camera beat dwell vs chat host-end", () => {
  afterEach(() => {
    resetChatCameraTrackerForTests();
    resetPlaybackCameraSessionForTests();
  });

  it("skips host-end during dwell unless force", () => {
    setCameraBeatDwellActive(true);
    expect(shouldYieldChatAutoCamera()).toBe(true);
    const el = {
      scrollTop: 100,
      scrollHeight: 2000,
      clientHeight: 400,
      classList: { contains: () => false },
      dataset: {},
      tagName: "DIV",
      id: "",
      className: "",
      getBoundingClientRect: () => mockRect(0, 400),
    } as unknown as HTMLElement;

    scrollCameraToHostEnd(el, { instant: true, reason: "settle" });
    expect(el.scrollTop).toBe(100);

    scrollCameraToHostEnd(el, {
      instant: true,
      force: true,
      skipHold: true,
      reason: "intentional",
    });
    expect(el.scrollTop).toBe(1600);
  });
});
