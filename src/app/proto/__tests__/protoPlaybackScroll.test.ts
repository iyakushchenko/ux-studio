import { afterEach, describe, expect, it, vi } from "vitest";
import {
  animateScrollTo,
  beginDemoTargetPageScroll,
  computeScrollTopForElement,
  easeInOutCubic,
  isPrototypePageScrollLocked,
} from "@/app/proto/protoPlaybackScroll";

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

describe("prototype page scroll lock", () => {
  it("skips animateScrollTo when scroll root is locked", async () => {
    const scrollEl = {
      scrollTop: 0,
      scrollHeight: 1200,
      clientHeight: 400,
      classList: { contains: (name: string) => name === "proto-scroll--locked" },
      dataset: {},
    } as unknown as HTMLElement;

    await animateScrollTo(scrollEl, 500);
    expect(scrollEl.scrollTop).toBe(0);
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
