/** Scenario playback — reusable shell for stepped “frame” reveals on prototype screens. */

import {
  animateScrollElementIntoView,
  animateScrollTo,
  cancelPlaybackScroll,
  computeScrollTopForElement,
  getPrototypeScrollRoot,
  isPlaybackScrollAnimating,
  registerPlaybackScrollCancelHook,
} from "@/app/scenario/playbackScroll";
import { playbackScrollMonitor } from "@/app/shell/playbackScrollMonitor";

/** Minimum revealed frames — chat never shows a blank thread (first bubble stays). */
export const SCENARIO_MIN_VISIBLE_FRAMES = 1;

export type ScenarioScreenConfig = {
  id: string;
  label: string;
  childIndex: number;
  minVisibleFrames?: number;
  /** Ms between frames when “play” is triggered. */
  playbackStepMs?: number;
};

export function getProtoScenarioForChildIndex(
  scenarios: readonly ScenarioScreenConfig[],
  childIndex: number
): ScenarioScreenConfig | undefined {
  return scenarios.find((s) => s.childIndex === childIndex);
}

export function getProtoScenarioById(
  scenarios: readonly ScenarioScreenConfig[],
  id: string
): ScenarioScreenConfig | undefined {
  return scenarios.find((s) => s.id === id);
}

/** @deprecated Import scenario list from active project content instead. */
export { BOOTS_PHARMACY_SCENARIO_SCREENS as SCENARIO_SCREENS } from "@/projects/boots-pharmacy/screens/scenarios";

export const SCENARIO_FRAME_ANIM_MS = 480;
export const SCENARIO_FRAME_MAX_PX = 3200;

function clearFrameHideTimer(frame: HTMLElement): void {
  const id = frame.dataset.studioScenarioHideTid;
  if (!id) return;
  window.clearTimeout(Number(id));
  delete frame.dataset.studioScenarioHideTid;
}

function reflowFrame(frame: HTMLElement): void {
  void frame.offsetHeight;
}

function animateFrameIn(frame: HTMLElement): void {
  frame.style.display = "";
  frame.classList.add("proto-scenario-frame--hidden");
  reflowFrame(frame);
  requestAnimationFrame(() => {
    frame.classList.remove("proto-scenario-frame--hidden");
  });
}

function animateFrameOut(frame: HTMLElement, onDone: () => void): void {
  clearFrameHideTimer(frame);
  frame.classList.remove("proto-scenario-frame--hidden");
  reflowFrame(frame);
  frame.classList.add("proto-scenario-frame--hidden");

  const finish = () => {
    frame.removeEventListener("transitionend", onEnd);
    onDone();
  };

  const onEnd = (event: TransitionEvent) => {
    if (event.target !== frame) return;
    if (event.propertyName !== "opacity" && event.propertyName !== "max-height") return;
    finish();
  };

  frame.addEventListener("transitionend", onEnd);
  frame.dataset.studioScenarioHideTid = String(
    window.setTimeout(finish, SCENARIO_FRAME_ANIM_MS + 80)
  );
}

export function applyScenarioFrameVisibility(
  frames: HTMLElement[],
  visibleCount: number
): void {
  frames.forEach((frame, index) => {
    const visible = index < visibleCount;
    const wasVisible = frame.dataset.studioScenarioVisible === "true";
    const wasHidden = frame.dataset.studioScenarioVisible === "false";

    frame.classList.add("proto-scenario-frame");
    frame.dataset.studioScenarioFrame = String(index + 1);

    if (visible) {
      clearFrameHideTimer(frame);
      const needsEnterAnim =
        wasHidden ||
        frame.style.display === "none" ||
        getComputedStyle(frame).display === "none";
      if (needsEnterAnim) {
        animateFrameIn(frame);
      } else {
        frame.style.display = "";
        frame.classList.remove("proto-scenario-frame--hidden");
      }
      frame.dataset.studioScenarioVisible = "true";
      return;
    }

    if (!wasVisible && !wasHidden) {
      frame.classList.add("proto-scenario-frame--hidden");
      frame.dataset.studioScenarioVisible = "false";
      frame.dataset.studioScenarioHideTid = String(
        window.setTimeout(() => {
          if (frame.dataset.studioScenarioVisible === "false") {
            frame.style.display = "none";
          }
          delete frame.dataset.studioScenarioHideTid;
        }, SCENARIO_FRAME_ANIM_MS + 50)
      );
      return;
    }

    frame.dataset.studioScenarioVisible = "false";
    animateFrameOut(frame, () => {
      if (frame.dataset.studioScenarioVisible === "false") {
        frame.style.display = "none";
      }
      delete frame.dataset.studioScenarioHideTid;
    });
  });
}

export type ScenarioScrollAlign = "start" | "center" | "end";
export type ScenarioScrollTiming =
  | "immediate"
  | "after-enter"
  | "after-exit"
  | "after-init";

/** Pin scroll while a bubble show/hide anim runs (scroll moves with the anim). */
const SCENARIO_SCROLL_ANIM_PIN_MS = SCENARIO_FRAME_ANIM_MS + 80;
/** Defer first scroll until chat layout + composer dock have settled. */
const SCENARIO_SCROLL_INITIAL_MS = 680;

export function scenarioScrollTiming(
  prevCount: number,
  nextCount: number
): ScenarioScrollTiming {
  if (prevCount === nextCount) return "immediate";
  // Step-back hides a bubble — defer scroll until collapse finishes so scrollHeight
  // shrink does not clamp scrollTop outside eased animation (scroll-jump diagnostic).
  if (nextCount < prevCount) return "after-exit";
  if (nextCount > prevCount) return "after-enter";
  return "immediate";
}

/** True when jumping to frame 1 and more than one bubble will hide. */
export function scenarioScrollTopBeforeCollapse(
  prevCount: number,
  nextCount: number,
  align: ScenarioScrollAlign,
  minVisible = SCENARIO_MIN_VISIBLE_FRAMES
): boolean {
  return (
    align === "start" &&
    nextCount <= minVisible &&
    prevCount > nextCount &&
    prevCount - nextCount > 1
  );
}

/** Scroll the prototype pane to top (e.g. jump-to-first-frame). */
export function scrollPrototypeScrollToTop(
  scrollEl?: HTMLElement | null,
  behavior: ScrollBehavior = "instant"
): void {
  const el =
    scrollEl ??
    document.querySelector<HTMLElement>(".studio-scroll--prototype:not(.hidden)") ??
    document.querySelector<HTMLElement>(".studio-scroll--prototype");
  if (!el) return;

  if (behavior === "smooth") {
    void animateScrollTo(el, 0);
    return;
  }

  const apply = () => {
    el.scrollTop = 0;
    el.scrollLeft = 0;
    el.scrollTo({ top: 0, left: 0, behavior });
  };

  apply();
  requestAnimationFrame(apply);
  window.setTimeout(apply, 0);
}

export function scrollPrototypeScrollToTopAfterLayout(
  scrollEl?: HTMLElement | null
): void {
  scrollPrototypeScrollToTop(scrollEl, "instant");
  window.setTimeout(
    () => scrollPrototypeScrollToTop(scrollEl, "instant"),
    SCENARIO_FRAME_ANIM_MS + 80
  );
}

/** Scroll the prototype pane to the bottom (show latest chat bubbles above composer). */
export function scrollPrototypeScrollToBottom(
  scrollEl?: HTMLElement | null,
  behavior: ScrollBehavior = "instant"
): void {
  const el =
    scrollEl ??
    document.querySelector<HTMLElement>(".studio-scroll--prototype:not(.hidden)") ??
    document.querySelector<HTMLElement>(".studio-scroll--prototype");
  if (!el) return;

  const top = Math.max(0, el.scrollHeight - el.clientHeight);
  if (behavior === "smooth") {
    void animateScrollTo(el, top, {
      resolveTargetTop: () => Math.max(0, el.scrollHeight - el.clientHeight),
    });
    return;
  }
  el.scrollTop = top;
  el.scrollTo({ top, left: 0, behavior });
}

/** One-shot bottom scroll after layout settles (initial load / jump to end). */
export function scrollPrototypeScrollToBottomOnce(
  scrollEl?: HTMLElement | null
): void {
  scrollPrototypeScrollToBottom(scrollEl, "instant");
  window.setTimeout(
    () => scrollPrototypeScrollToBottom(scrollEl, "instant"),
    SCENARIO_FRAME_ANIM_MS + 80
  );
}

export function scrollScenarioFrameIntoView(
  frame: HTMLElement | null,
  align: ScenarioScrollAlign = "end",
  smooth = true
): void {
  if (!frame) return;
  if (smooth) {
    void animateScrollElementIntoView(frame, { align });
    return;
  }
  const scrollEl = getPrototypeScrollRoot(frame);
  if (!scrollEl) return;
  scrollEl.scrollTop = computeScrollTopForElement(scrollEl, frame, align);
}

export function scrollScenarioChatAnchor(
  frames: HTMLElement[],
  visibleCount: number,
  align: ScenarioScrollAlign = "end",
  scrollEl?: HTMLElement | null,
  smooth = true
): void {
  const behavior: ScrollBehavior = smooth ? "smooth" : "instant";

  if (align === "start") {
    scrollPrototypeScrollToTop(scrollEl, behavior);
    if (!smooth) {
      window.setTimeout(
        () => scrollPrototypeScrollToTop(scrollEl, "instant"),
        SCENARIO_FRAME_ANIM_MS + 80
      );
    }
    return;
  }

  if (visibleCount > 0) {
    const run = () => {
      if (align === "end" && scrollEl) {
        scrollPrototypeScrollToBottom(scrollEl, behavior);
        return;
      }
      const lastFrame = frames[visibleCount - 1] ?? null;
      if (lastFrame) {
        if (smooth) {
          void animateScrollElementIntoView(lastFrame, { align: "end" });
        } else {
          const root = resolveScrollEl(scrollEl);
          if (root) {
            root.scrollTop = computeScrollTopForElement(root, lastFrame, "end");
          }
        }
        return;
      }
      scrollPrototypeScrollToBottom(scrollEl, behavior);
    };
    run();
    return;
  }

  const anchor =
    frames[0]?.closest<HTMLElement>('[data-name="component.appointment.summary"]') ??
    frames[0]?.parentElement;
  if (anchor) {
    if (smooth) {
      void animateScrollElementIntoView(anchor, { align: "start" });
    } else {
      const root = resolveScrollEl(scrollEl);
      if (root) {
        root.scrollTop = computeScrollTopForElement(root, anchor, "start");
      }
    }
  }
}

export function anchorScenarioScrollToVisibleEnd(
  scrollEl?: HTMLElement | null
): void {
  scrollPrototypeScrollToBottom(scrollEl, "instant");
  requestAnimationFrame(() => scrollPrototypeScrollToBottom(scrollEl, "instant"));
}

let activeScrollPinStop: (() => void) | null = null;
let scenarioScrollGeneration = 0;

/** Drop pending scroll settle timers/pins after a manual transport interrupt. */
export function   bumpScenarioScrollGeneration(): void {
  scenarioScrollGeneration += 1;
  activeScrollPinStop?.();
  cancelPlaybackScroll("abort");
}

function resolveScrollEl(scrollEl?: HTMLElement | null): HTMLElement | null {
  return (
    scrollEl ??
    document.querySelector<HTMLElement>(".studio-scroll--prototype:not(.hidden)") ??
    document.querySelector<HTMLElement>(".studio-scroll--prototype")
  );
}

function startScrollPin(
  scrollEl: HTMLElement | null | undefined,
  applyPin: () => void,
  durationMs: number
): void {
  const el = resolveScrollEl(scrollEl);
  if (!el) return;

  activeScrollPinStop?.();

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    el.removeEventListener("wheel", stop);
    el.removeEventListener("touchstart", stop);
    el.removeEventListener("pointerdown", stop);
    if (activeScrollPinStop === stop) activeScrollPinStop = null;
    const settled = resolveScrollEl(scrollEl);
    if (settled) playbackScrollMonitor.noteScrollPosition(settled.scrollTop);
  };

  activeScrollPinStop = stop;
  el.addEventListener("wheel", stop, { passive: true });
  el.addEventListener("touchstart", stop, { passive: true });
  el.addEventListener("pointerdown", stop, { passive: true });

  const started = performance.now();
  const tick = () => {
    if (stopped) return;
    if (isPlaybackScrollAnimating()) {
      stop();
      return;
    }
    applyPin();
    const pinnedEl = resolveScrollEl(scrollEl);
    if (pinnedEl) playbackScrollMonitor.onPinApply(pinnedEl.scrollTop);
    if (performance.now() - started < durationMs) {
      requestAnimationFrame(tick);
    } else {
      stop();
    }
  };

  tick();
}

/** Keep chat pinned to bottom while bubble layout animates (step forward / back). */
export function pinScenarioScrollToBottomDuring(
  scrollEl: HTMLElement | null | undefined,
  durationMs = SCENARIO_SCROLL_ANIM_PIN_MS
): void {
  startScrollPin(
    scrollEl,
    () => scrollPrototypeScrollToBottom(scrollEl, "instant"),
    durationMs
  );
}

/** Keep chat pinned to top while landing on frame 1 (after bubbles collapse). */
export function pinScenarioScrollToTopDuring(
  scrollEl: HTMLElement | null | undefined,
  durationMs = SCENARIO_SCROLL_ANIM_PIN_MS
): void {
  startScrollPin(scrollEl, () => scrollPrototypeScrollToTop(scrollEl, "instant"), durationMs);
}

function scrollFrameInRoot(
  frame: HTMLElement,
  scrollEl: HTMLElement,
  block: "start" | "end"
): void {
  const frameRect = frame.getBoundingClientRect();
  const rootRect = scrollEl.getBoundingClientRect();
  const deltaTop = frameRect.top - rootRect.top;

  if (block === "start") {
    scrollEl.scrollTop += deltaTop;
    return;
  }

  scrollEl.scrollTop += deltaTop - (scrollEl.clientHeight - frameRect.height);
}

function scrollBottomTop(scrollEl: HTMLElement): number {
  return Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
}

function animateScrollToBottom(
  scrollEl: HTMLElement,
  durationMs?: number
): void {
  void animateScrollTo(scrollEl, scrollBottomTop(scrollEl), {
    durationMs,
    resolveTargetTop: () => scrollBottomTop(scrollEl),
  });
}

function settleScrollAfterForwardStep(
  frames: HTMLElement[],
  visibleCount: number,
  scrollEl: HTMLElement | null | undefined,
  smooth = false
): void {
  const el = resolveScrollEl(scrollEl);
  const last = frames[visibleCount - 1];
  if (!el || !last) return;

  const tallBubble = last.offsetHeight > el.clientHeight * 0.4;
  if (smooth) {
    if (tallBubble) {
      void animateScrollElementIntoView(last, { scrollEl: el, align: "start" });
      return;
    }
    animateScrollToBottom(el);
    return;
  }

  if (tallBubble) {
    scrollFrameInRoot(last, el, "start");
    return;
  }

  scrollPrototypeScrollToBottom(el, "instant");
}

export function scheduleScenarioScroll(
  frames: HTMLElement[],
  visibleCount: number,
  align: ScenarioScrollAlign,
  scrollEl: HTMLElement | null | undefined,
  smooth: boolean,
  timing: ScenarioScrollTiming = "immediate",
  prevCount = visibleCount
): void {
  if (frames.length === 0) {
    if (align === "start") {
      scrollPrototypeScrollToTop(scrollEl, "instant");
    }
    return;
  }

  const generation = scenarioScrollGeneration;
  const el = resolveScrollEl(scrollEl);
  const steppedForwardOne = visibleCount === prevCount + 1;

  if (timing === "after-init" && align === "end") {
    if (smooth && el) {
      animateScrollToBottom(el);
      return;
    }
    scrollPrototypeScrollToBottom(scrollEl, "instant");
    pinScenarioScrollToBottomDuring(scrollEl, SCENARIO_SCROLL_INITIAL_MS);
    return;
  }

  if (timing === "after-exit") {
    pinScenarioScrollToBottomDuring(scrollEl, SCENARIO_SCROLL_ANIM_PIN_MS * 2);
    window.setTimeout(() => {
      if (generation !== scenarioScrollGeneration) return;
      scrollPrototypeScrollToBottom(scrollEl, "instant");
      const settled = resolveScrollEl(scrollEl);
      if (settled) playbackScrollMonitor.noteScrollPosition(settled.scrollTop);
      pinScenarioScrollToBottomDuring(scrollEl);
    }, SCENARIO_SCROLL_ANIM_PIN_MS);
    return;
  }

  if (timing === "after-enter") {
    pinScenarioScrollToBottomDuring(scrollEl, SCENARIO_SCROLL_ANIM_PIN_MS * 2);
    window.setTimeout(() => {
      if (generation !== scenarioScrollGeneration) return;
      if (steppedForwardOne) {
        settleScrollAfterForwardStep(frames, visibleCount, scrollEl, smooth);
      } else if (align === "end" && el) {
        if (smooth) animateScrollToBottom(el);
        else scrollPrototypeScrollToBottom(scrollEl, "instant");
      }
      pinScenarioScrollToBottomDuring(scrollEl);
    }, SCENARIO_SCROLL_ANIM_PIN_MS);
    return;
  }

  if (align === "start") {
    if (smooth && el) {
      void animateScrollTo(el, 0);
      return;
    }
    scrollPrototypeScrollToTop(scrollEl, "instant");
    pinScenarioScrollToTopDuring(scrollEl);
    return;
  }

  if (!smooth) {
    if (steppedForwardOne) {
      settleScrollAfterForwardStep(frames, visibleCount, scrollEl, false);
    } else {
      scrollPrototypeScrollToBottom(scrollEl, "instant");
    }
    pinScenarioScrollToBottomDuring(scrollEl);
    return;
  }

  pinScenarioScrollToBottomDuring(scrollEl);
  window.setTimeout(() => {
    if (generation !== scenarioScrollGeneration) return;
    if (steppedForwardOne) {
      settleScrollAfterForwardStep(frames, visibleCount, scrollEl, true);
      return;
    }
    if (el) {
      animateScrollToBottom(el);
    }
  }, SCENARIO_SCROLL_ANIM_PIN_MS);
}

export function runScenarioScrollAfterFrames(
  frames: HTMLElement[],
  visibleCount: number,
  align: ScenarioScrollAlign,
  scrollEl: HTMLElement | null | undefined,
  smooth: boolean,
  timing: ScenarioScrollTiming = "immediate",
  prevCount = visibleCount
): void {
  scheduleScenarioScroll(
    frames,
    visibleCount,
    align,
    scrollEl,
    smooth,
    timing,
    prevCount
  );
}

registerPlaybackScrollCancelHook(() => {
  activeScrollPinStop?.();
});
