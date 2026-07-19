/** @vitest-environment happy-dom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearDemoCtaStates,
  isDemoCursorPointerMode,
  removeDemoCursor,
  settleDemoCursorAfterClick,
  simulateDemoPointerClick,
  simulateDemoPointerHover,
} from "@/app/scenario/demoCursor";
import { removeDemoPseudoBridge } from "@/app/scenario/demoCursorPseudoBridge";

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
});
