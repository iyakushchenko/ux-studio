/** @vitest-environment happy-dom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelDemoCursorTravel,
  clearDemoCtaStates,
  isDemoCursorPointerMode,
  moveDemoCursorTo,
  removeDemoCursor,
  settleDemoCursorAfterClick,
  simulateDemoPointerClick,
  simulateDemoPointerHover,
} from "@/app/scenario/demoCursor";
import { removeDemoPseudoBridge } from "@/app/scenario/demoCursorPseudoBridge";

/**
 * Motion's frame batcher captures requestAnimationFrame at import time, so
 * Vitest fake-timer stubs never drive the real `animate`. Provide a compatible
 * progress tween that uses the live global rAF (stubbed below) + easeInOut.
 */
vi.mock("@/uxds/motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/uxds/motion")>();
  const easeInOut =
    typeof actual.easeInOut === "function"
      ? actual.easeInOut
      : (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  return {
    ...actual,
    animate(
      from: number,
      to: number,
      options: {
        duration?: number;
        onUpdate?: (value: number) => void;
      }
    ) {
      let rafId: number | null = null;
      let stopped = false;
      const durationMs = Math.max(1, (options.duration ?? 0.3) * 1000);
      const start = performance.now();
      let settle!: () => void;
      const finished = new Promise<void>((resolve) => {
        settle = resolve;
      });

      const tick = (now: number) => {
        rafId = null;
        if (stopped) {
          settle();
          return;
        }
        const t = Math.min(1, (now - start) / durationMs);
        const progress = from + (to - from) * easeInOut(t);
        options.onUpdate?.(progress);
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          settle();
        }
      };
      rafId = requestAnimationFrame(tick);

      return {
        stop() {
          stopped = true;
          if (rafId != null) cancelAnimationFrame(rafId);
          rafId = null;
          settle();
        },
        then(onFulfilled?: (value: void) => unknown, onRejected?: (reason: unknown) => unknown) {
          return finished.then(onFulfilled, onRejected);
        },
        animations: [],
      };
    },
  };
});

vi.mock("@/app/scenario/playbackScroll", () => ({
  beginDemoTargetPageScroll: vi.fn(async () => ({
    durationMs: 0,
    scrollPromise: Promise.resolve(),
  })),
  isDemoTargetInPrototypeView: vi.fn(() => true),
  isPrototypeOverlayTarget: vi.fn(() => false),
  isPrototypePageScrollLocked: vi.fn(() => false),
  revealDemoTargetForAgent: vi.fn(async () => {}),
  snapDemoTargetIntoView: vi.fn(),
}));

vi.mock("@/app/shell/studioModalGuard", () => ({
  isElementBlockedByModal: vi.fn(() => false),
  resolveClickTargetRespectingModal: vi.fn((el: HTMLElement) => el),
}));

vi.mock("@/app/shell/playbackCursorDiagnostic", () => ({
  describeCursorTarget: vi.fn(() => "btn"),
  notePlaybackCursorEvent: vi.fn(),
}));

vi.mock("@/app/shell/playbackInteractionContext", () => ({
  notePlaybackDemoClick: vi.fn(),
}));

function mountButton(label = "Close"): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "proto-popup-close";
  btn.textContent = label;
  btn.getBoundingClientRect = () =>
    ({
      left: 100,
      top: 100,
      right: 128,
      bottom: 128,
      width: 28,
      height: 28,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    }) as DOMRect;
  document.body.appendChild(btn);
  return btn;
}

describe("demoCursor interaction contract", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    // Advance clock each frame so travel easing reaches t=1 under fake timers.
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      return window.setTimeout(() => {
        now += 120;
        cb(now);
      }, 0) as unknown as number;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      window.clearTimeout(id);
    });
  });

  afterEach(() => {
    removeDemoCursor({ immediate: true });
    clearDemoCtaStates();
    removeDemoPseudoBridge();
    document.body.innerHTML = "";
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("dispatches enter/over/move on hover and applies hover class", async () => {
    const btn = mountButton();
    const seen: string[] = [];
    for (const type of [
      "pointerover",
      "pointerenter",
      "mouseover",
      "mouseenter",
      "pointermove",
      "mousemove",
    ] as const) {
      btn.addEventListener(type, () => seen.push(type));
    }

    const hoverPromise = simulateDemoPointerHover(btn, 50, { scroll: false });
    await vi.runAllTimersAsync();
    const ok = await hoverPromise;
    expect(ok).toBe(true);
    expect(seen).toEqual(
      expect.arrayContaining([
        "pointerover",
        "pointerenter",
        "mouseover",
        "mouseenter",
        "pointermove",
        "mousemove",
      ])
    );
  });

  it("dispatches down/up during click and returns cursor graphic to default", async () => {
    const btn = mountButton();
    const seen: string[] = [];
    for (const type of [
      "pointerdown",
      "mousedown",
      "pointerup",
      "mouseup",
      "click",
    ] as const) {
      btn.addEventListener(type, () => seen.push(type));
    }

    let pressedWhileDown = false;
    btn.addEventListener("pointerdown", () => {
      pressedWhileDown =
        btn.classList.contains("proto-chat-cta--pressed") &&
        btn.classList.contains("proto-chat-cta--hover");
    });

    const clickPromise = simulateDemoPointerClick(btn, { scroll: false });
    await vi.runAllTimersAsync();
    const ok = await clickPromise;
    expect(ok).toBe(true);
    expect(pressedWhileDown).toBe(true);
    expect(seen).toEqual(
      expect.arrayContaining([
        "pointerdown",
        "mousedown",
        "pointerup",
        "mouseup",
        "click",
      ])
    );
    expect(isDemoCursorPointerMode()).toBe(false);
    expect(btn.classList.contains("proto-chat-cta--hover")).toBe(false);
    expect(btn.classList.contains("proto-chat-cta--pressed")).toBe(false);
  });

  it("settleDemoCursorAfterClick clears pointer mode immediately", () => {
    const cursor = document.createElement("div");
    cursor.className = "proto-chat-demo-cursor proto-chat-demo-cursor--pointer";
    document.body.appendChild(cursor);
    const btn = mountButton();
    btn.classList.add("proto-chat-cta--hover", "proto-chat-cta--pressed");

    settleDemoCursorAfterClick(cursor, btn);

    expect(cursor.classList.contains("proto-chat-demo-cursor--pointer")).toBe(
      false
    );
    expect(btn.classList.contains("proto-chat-cta--hover")).toBe(false);
    expect(btn.classList.contains("proto-chat-cta--pressed")).toBe(false);
  });

  it("remove/forceClear cancels in-flight Motion travel (hang guard)", async () => {
    const btn = mountButton();
    const travel = moveDemoCursorTo(btn, {
      applyHover: true,
      syncPageScroll: false,
    });
    // Mid-travel teardown — must stop Motion controls (no orphan tween).
    cancelDemoCursorTravel();
    removeDemoCursor({ immediate: true });
    await vi.runAllTimersAsync();
    const result = await travel;
    expect(result).toBeNull();
    expect(document.querySelector(".proto-chat-demo-cursor")).toBeNull();
  });

  it("travel stays within start→end bounds (no bounce/overshoot)", async () => {
    const btn = mountButton();
    const leftSamples: number[] = [];
    const topSamples: number[] = [];

    const travel = moveDemoCursorTo(btn, {
      applyHover: false,
      syncPageScroll: false,
    });

    for (let i = 0; i < 12; i++) {
      await vi.advanceTimersByTimeAsync(80);
      const el = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
      if (!el) break;
      const left = Number.parseFloat(el.style.left);
      const top = Number.parseFloat(el.style.top);
      if (Number.isFinite(left)) leftSamples.push(left);
      if (Number.isFinite(top)) topSamples.push(top);
    }
    await vi.runAllTimersAsync();
    const cursor = await travel;
    expect(cursor).not.toBeNull();

    const endLeft = Number.parseFloat(cursor!.style.left);
    const endTop = Number.parseFloat(cursor!.style.top);
    const startLeft = leftSamples[0] ?? endLeft;
    const startTop = topSamples[0] ?? endTop;
    const minL = Math.min(startLeft, endLeft);
    const maxL = Math.max(startLeft, endLeft);
    const minT = Math.min(startTop, endTop);
    const maxT = Math.max(startTop, endTop);
    // Ease-in-out lerp must never overshoot the endpoint box (1px float slack).
    for (const left of leftSamples) {
      expect(left).toBeGreaterThanOrEqual(minL - 1);
      expect(left).toBeLessThanOrEqual(maxL + 1);
    }
    for (const top of topSamples) {
      expect(top).toBeGreaterThanOrEqual(minT - 1);
      expect(top).toBeLessThanOrEqual(maxT + 1);
    }
  });

  it("does not re-flood enter/move when hover already active", async () => {
    const btn = mountButton();
    const seen: string[] = [];
    for (const type of [
      "pointerover",
      "pointerenter",
      "pointermove",
      "mousemove",
    ] as const) {
      btn.addEventListener(type, () => seen.push(type));
    }

    const hoverPromise = simulateDemoPointerHover(btn, 80, { scroll: false });
    await vi.runAllTimersAsync();
    expect(await hoverPromise).toBe(true);

    const enters = seen.filter((t) => t === "pointerenter").length;
    const moves = seen.filter((t) => t === "pointermove").length;
    expect(enters).toBe(1);
    // Enter path fires one move; no per-frame / re-set flood.
    expect(moves).toBeLessThanOrEqual(2);
  });
});
