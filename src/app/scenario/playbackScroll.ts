/** Playback scroll — eased, awaitable scroll for studio scripts (not browser smooth). */

import { playbackScrollMonitor } from "@/app/shell/playbackScrollMonitor";

export type PlaybackScrollAlign = "start" | "center" | "end" | "nearest";

export type PlaybackScrollOptions = {
  durationMs?: number;
  signal?: AbortSignal;
  shouldAbort?: () => boolean;
  /** Re-read scroll target each frame (layout shifts during chat bubbles, etc.). */
  resolveTargetTop?: () => number;
};

let activeScrollRaf: number | null = null;
let activeScrollAbort: AbortController | null = null;
let playbackScrollAnimating = false;
const playbackScrollCancelHooks = new Set<() => void>();

/** Lets scenario scroll pins yield while eased playback scroll runs. */
export function registerPlaybackScrollCancelHook(hook: () => void): () => void {
  playbackScrollCancelHooks.add(hook);
  return () => playbackScrollCancelHooks.delete(hook);
}

export function isPlaybackScrollAnimating(): boolean {
  return playbackScrollAnimating;
}

let scrollReplacePending = false;

export function cancelPlaybackScroll(reason: "replace" | "abort" = "abort"): void {
  if (reason === "abort") {
    playbackScrollMonitor.onAnimationCancelled();
  } else {
    scrollReplacePending = true;
  }
  if (activeScrollRaf != null) {
    cancelAnimationFrame(activeScrollRaf);
    activeScrollRaf = null;
  }
  activeScrollAbort?.abort();
  activeScrollAbort = null;
  playbackScrollAnimating = false;
  playbackScrollCancelHooks.forEach((hook) => hook());
}

export function easeInOutCubic(progress: number): number {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

/** Softer deceleration — chat / scenario scroll (not demo cursor travel). */
export function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isAborted(options?: PlaybackScrollOptions): boolean {
  if (options?.signal?.aborted) return true;
  if (options?.shouldAbort?.()) return true;
  return false;
}

function computeDuration(distance: number, durationMs?: number): number {
  if (durationMs != null) return durationMs;
  return Math.min(1050, Math.max(520, Math.abs(distance) * 0.62));
}

/** Demo robot targets — slightly longer, always centers the CTA in the pane. */
export const DEMO_TARGET_SCROLL_ALIGN: PlaybackScrollAlign = "center";
export const DEMO_TARGET_SCROLL_PADDING = 88;
/** Extra bottom inset so targets clear the BR AGENT TESTING panel. */
export const AGENT_TESTING_SCROLL_BOTTOM_PAD = 200;

/** True when the target is comfortably inside the prototype scroll viewport. */
export function isDemoTargetInPrototypeView(
  target: HTMLElement,
  options?: {
    scrollEl?: HTMLElement | null;
    paddingTop?: number;
    paddingBottom?: number;
  }
): boolean {
  const scrollEl = options?.scrollEl ?? getPrototypeScrollRoot(target);
  if (!scrollEl || !target.isConnected) return false;
  const padTop = options?.paddingTop ?? DEMO_TARGET_SCROLL_PADDING;
  const padBottom =
    (options?.paddingBottom ?? demoScrollPadding()) +
    readScrollPaddingBottom(scrollEl);
  const rootRect = scrollEl.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (targetRect.width < 2 || targetRect.height < 2) return false;
  return (
    targetRect.top >= rootRect.top + padTop &&
    targetRect.bottom <= rootRect.bottom - padBottom &&
    targetRect.left < rootRect.right &&
    targetRect.right > rootRect.left
  );
}

function isAgentTestingScrollPadActive(): boolean {
  if (typeof document === "undefined") return false;
  if (document.documentElement.dataset.studioAgentTesting === "true") return true;
  const root = document.getElementById("agent-testing-overlay");
  return root?.dataset.active === "true" || root?.dataset.settling === "true";
}

/** CSS `scroll-padding-bottom` on the scroll host (Chat composer dock pad). */
export function readScrollPaddingBottom(scrollEl: HTMLElement): number {
  if (typeof getComputedStyle === "undefined") return 0;
  try {
    const raw = getComputedStyle(scrollEl).scrollPaddingBottom;
    if (!raw || raw === "auto") return 0;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    // Unit mocks may not be real Elements — treat as no CSS pad.
    return 0;
  }
}

/** Agent-testing / default inset only — Chat composer pad is CSS scroll-padding-bottom. */
function demoScrollPadding(): number {
  return isAgentTestingScrollPadActive()
    ? AGENT_TESTING_SCROLL_BOTTOM_PAD
    : DEMO_TARGET_SCROLL_PADDING;
}

/**
 * Scroll the prototype root so the PO can see the robo-cursor target.
 * Prefers eased scroll; snaps if still out of view (agent-testing / below-fold).
 */
export async function revealDemoTargetForAgent(
  target: HTMLElement,
  options?: PlaybackScrollOptions & {
    scrollEl?: HTMLElement;
    align?: PlaybackScrollAlign;
    /** Force instant snap (no eased camera). */
    instant?: boolean;
  }
): Promise<{ scrolled: boolean; inView: boolean }> {
  const scrollEl = options?.scrollEl ?? getPrototypeScrollRoot(target);
  if (
    !scrollEl ||
    !target.isConnected ||
    shouldSkipPrototypePageScroll(target, scrollEl)
  ) {
    return {
      scrolled: false,
      inView: isDemoTargetInPrototypeView(target, { scrollEl }),
    };
  }

  const padding = demoScrollPadding();
  const align = options?.align ?? DEMO_TARGET_SCROLL_ALIGN;
  const alreadyInView = isDemoTargetInPrototypeView(target, {
    scrollEl,
    paddingTop: DEMO_TARGET_SCROLL_PADDING,
    paddingBottom: padding,
  });
  if (alreadyInView && !options?.instant) {
    return { scrolled: false, inView: true };
  }

  if (options?.instant) {
    snapDemoTargetIntoView(target, { scrollEl, align, padding });
  } else {
    await animateDemoTargetIntoView(target, {
      ...options,
      scrollEl,
      align,
      padding,
    });
  }

  let inView = isDemoTargetInPrototypeView(target, {
    scrollEl,
    paddingTop: DEMO_TARGET_SCROLL_PADDING,
    paddingBottom: padding,
  });
  if (!inView) {
    snapDemoTargetIntoView(target, { scrollEl, align, padding });
    inView = isDemoTargetInPrototypeView(target, {
      scrollEl,
      paddingTop: Math.min(48, DEMO_TARGET_SCROLL_PADDING),
      paddingBottom: Math.min(96, padding),
    });
  }
  return { scrolled: true, inView };
}

export function computeDemoScrollDuration(distance: number): number {
  return Math.min(1200, Math.max(720, Math.abs(distance) * 0.82));
}

export async function animateDemoTargetIntoView(
  target: HTMLElement,
  options?: PlaybackScrollOptions & {
    scrollEl?: HTMLElement;
    align?: PlaybackScrollAlign;
    padding?: number;
  }
): Promise<void> {
  const scrollEl = options?.scrollEl ?? getPrototypeScrollRoot(target);
  if (!scrollEl || shouldSkipPrototypePageScroll(target, scrollEl)) return;

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
  if (isAborted(options)) return;

  const align = options?.align ?? DEMO_TARGET_SCROLL_ALIGN;
  const padding = options?.padding ?? demoScrollPadding();
  const targetTop = computeScrollTopForElement(scrollEl, target, align, padding);
  const distance = Math.abs(targetTop - scrollEl.scrollTop);
  const durationMs =
    options?.durationMs ?? computeDemoScrollDuration(distance);
  const resolveTargetTop = () =>
    computeScrollTopForElement(scrollEl, target, align, padding);

  await animateScrollTo(scrollEl, targetTop, {
    ...options,
    durationMs,
    resolveTargetTop,
  });
}

/** Instant scroll for CJM step-back beat-enter sync — no eased camera move. */
export function snapDemoTargetIntoView(
  target: HTMLElement,
  options?: {
    scrollEl?: HTMLElement;
    align?: PlaybackScrollAlign;
    padding?: number;
  }
): void {
  const scrollEl = options?.scrollEl ?? getPrototypeScrollRoot(target);
  if (!scrollEl || shouldSkipPrototypePageScroll(target, scrollEl)) return;

  const align = options?.align ?? DEMO_TARGET_SCROLL_ALIGN;
  const padding = options?.padding ?? demoScrollPadding();
  const targetTop = computeScrollTopForElement(scrollEl, target, align, padding);
  const maxScroll = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
  scrollEl.scrollTop = Math.min(Math.max(0, targetTop), maxScroll);
}

/**
 * Scroll the prototype pane to frame a demo target, returning the eased duration used.
 * Pair with cursor travel so both finish together.
 */
export async function beginDemoTargetPageScroll(
  target: HTMLElement,
  options?: PlaybackScrollOptions & {
    scrollEl?: HTMLElement;
    align?: PlaybackScrollAlign;
    padding?: number;
  }
): Promise<{ durationMs: number; scrollPromise: Promise<void> }> {
  const scrollEl = options?.scrollEl ?? getPrototypeScrollRoot(target);
  if (
    !scrollEl ||
    !target.isConnected ||
    shouldSkipPrototypePageScroll(target, scrollEl)
  ) {
    return { durationMs: 0, scrollPromise: Promise.resolve() };
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
  if (isAborted(options)) {
    return { durationMs: 0, scrollPromise: Promise.resolve() };
  }

  const align = options?.align ?? DEMO_TARGET_SCROLL_ALIGN;
  const padding = options?.padding ?? demoScrollPadding();
  const targetTop = computeScrollTopForElement(scrollEl, target, align, padding);
  const distance = Math.abs(targetTop - scrollEl.scrollTop);
  const durationMs =
    options?.durationMs ?? computeDemoScrollDuration(distance);

  if (distance < 2) {
    // Still snap if the element is clipped (padding / BR panel) even when
    // center-delta is tiny — keeps below-fold + agent-testing reveals honest.
    if (
      !isDemoTargetInPrototypeView(target, {
        scrollEl,
        paddingTop: DEMO_TARGET_SCROLL_PADDING,
        paddingBottom: padding,
      })
    ) {
      snapDemoTargetIntoView(target, { scrollEl, align, padding });
      return { durationMs: 0, scrollPromise: Promise.resolve() };
    }
    return { durationMs: 0, scrollPromise: Promise.resolve() };
  }

  const resolveTargetTop = () =>
    computeScrollTopForElement(scrollEl, target, align, padding);

  return {
    durationMs,
    scrollPromise: animateScrollTo(scrollEl, targetTop, {
      ...options,
      durationMs,
      resolveTargetTop,
    }),
  };
}

/** React Chat sole scroll surface after single-scrollbar mount (viewport locked). */
const CHAT_COLUMN_SCROLL_SELECTOR =
  '[data-studio-react-screen="chat"] .chat__column, main.chat .chat__column';

function queryPrototypeScrollPane(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>(
      ".studio-scroll--prototype:not(.hidden)"
    ) ?? document.querySelector<HTMLElement>(".studio-scroll--prototype")
  );
}

function isScrollPanePopupLocked(el: HTMLElement | null | undefined): boolean {
  return Boolean(
    el?.classList?.contains("studio-scroll--locked") ||
      el?.dataset.studioScrollLocked === "true"
  );
}

/** True when Chat column is on the active (displayed) screen — not a hidden sibling. */
function isActiveChatColumnScrollHost(el: HTMLElement | null): el is HTMLElement {
  if (!el?.isConnected) return false;
  // Inactive Boots screens use display:none — zero client rects.
  if (el.getClientRects().length === 0) return false;
  return el.scrollHeight - el.clientHeight > 1 || el.clientHeight > 0;
}

function queryActiveChatColumnScrollRoot(
  scope?: ParentNode | null
): HTMLElement | null {
  const root = scope ?? document;
  const candidates = root.querySelectorAll<HTMLElement>(CHAT_COLUMN_SCROLL_SELECTOR);
  for (const el of candidates) {
    if (isActiveChatColumnScrollHost(el)) return el;
  }
  return null;
}

/**
 * Active prototype scroll host.
 * Prefer `.chat__column` when React Chat owns overflow (outer pane is
 * non-scrolling); otherwise `.studio-scroll--prototype`.
 */
export function getPrototypeScrollRoot(from?: HTMLElement | null): HTMLElement | null {
  if (from) {
    const chatColumn = from.closest<HTMLElement>(".chat__column");
    if (chatColumn && isActiveChatColumnScrollHost(chatColumn)) {
      return chatColumn;
    }
  }

  const proto = from
    ? from.closest<HTMLElement>(".studio-scroll--prototype")
    : queryPrototypeScrollPane();

  // Viewport-bound Chat: overflow lives on `.chat__column`, not proto.
  if (proto) {
    const chatUnder = queryActiveChatColumnScrollRoot(proto);
    if (chatUnder) {
      const protoMax = Math.max(0, proto.scrollHeight - proto.clientHeight);
      if (protoMax < 2) return chatUnder;
    }
    return proto;
  }

  return queryActiveChatColumnScrollRoot() ?? queryPrototypeScrollPane();
}

/** True when a modal/popup is open — prototype page scroll must stay put. */
export function isPrototypePageScrollLocked(
  scrollEl?: HTMLElement | null
): boolean {
  const root =
    scrollEl ??
    (typeof document !== "undefined" ? getPrototypeScrollRoot() : null);
  if (isScrollPanePopupLocked(root)) return true;
  // Nested chat column: popup lock still lives on the outer prototype pane.
  if (!root?.classList?.contains?.("chat__column")) return false;
  const proto = root.closest?.(".studio-scroll--prototype") ?? null;
  return isScrollPanePopupLocked(proto);
}

/** Demo targets inside overlay scrims must not pull the page behind them. */
export function isPrototypeOverlayTarget(target: HTMLElement): boolean {
  return Boolean(target.closest(".studio-avail-scrim, .proto-avail-card"));
}

function shouldSkipPrototypePageScroll(
  target?: HTMLElement | null,
  scrollEl?: HTMLElement | null
): boolean {
  if (isPrototypePageScrollLocked(scrollEl)) return true;
  if (target && isPrototypeOverlayTarget(target)) return true;
  return false;
}

export function computeScrollTopForElement(
  scrollEl: HTMLElement,
  target: HTMLElement,
  align: PlaybackScrollAlign = "nearest",
  padding = 0
): number {
  const maxScroll = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
  const currentScroll = scrollEl.scrollTop;
  const rootRect = scrollEl.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  // Caller padding (agent-testing / demo) + host CSS scroll-padding-bottom
  // (Chat sticky composer) so below-fold bubbles clear the dock.
  const padTop = padding;
  const padBottom = padding + readScrollPaddingBottom(scrollEl);

  const targetTopInScroll = currentScroll + (targetRect.top - rootRect.top);
  const targetBottomInScroll = targetTopInScroll + targetRect.height;
  const viewTop = currentScroll + padTop;
  const viewBottom = currentScroll + scrollEl.clientHeight - padBottom;

  if (align === "start") {
    return clamp(targetTopInScroll - padTop, 0, maxScroll);
  }
  if (align === "center") {
    const centered =
      targetTopInScroll + targetRect.height / 2 - scrollEl.clientHeight / 2;
    return clamp(centered, 0, maxScroll);
  }
  if (align === "end") {
    return clamp(
      targetBottomInScroll - scrollEl.clientHeight + padBottom,
      0,
      maxScroll
    );
  }

  if (targetTopInScroll >= viewTop && targetBottomInScroll <= viewBottom) {
    return currentScroll;
  }
  if (targetTopInScroll < viewTop) {
    return clamp(targetTopInScroll - padTop, 0, maxScroll);
  }
  return clamp(
    targetBottomInScroll - scrollEl.clientHeight + padBottom,
    0,
    maxScroll
  );
}

export function animateScrollTo(
  scrollEl: HTMLElement,
  targetTop: number,
  options?: PlaybackScrollOptions
): Promise<void> {
  cancelPlaybackScroll("replace");

  if (isPrototypePageScrollLocked(scrollEl)) {
    return Promise.resolve();
  }

  const maxScroll = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
  const top = clamp(targetTop, 0, maxScroll);
  const startTop = scrollEl.scrollTop;
  const distance = top - startTop;

  if (Math.abs(distance) < 2) {
    scrollEl.scrollTop = top;
    return Promise.resolve();
  }

  if (isAborted(options)) {
    return Promise.resolve();
  }

  const controller = new AbortController();
  activeScrollAbort = controller;
  const externalSignal = options?.signal;
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onExternalAbort, { once: true });

  const duration = computeDuration(distance, options?.durationMs);
  const startTime = performance.now();
  const resolveTargetTop = options?.resolveTargetTop;
  let lastFrameTime = startTime;

  playbackScrollMonitor.onAnimationStart({
    startTop,
    targetTop: top,
    duration,
  });

  return new Promise<void>((resolve) => {
    const cleanup = () => {
      if (activeScrollRaf != null) {
        cancelAnimationFrame(activeScrollRaf);
        activeScrollRaf = null;
      }
      externalSignal?.removeEventListener("abort", onExternalAbort);
      if (activeScrollAbort === controller) {
        activeScrollAbort = null;
      }
      playbackScrollAnimating = false;
    };

    const finish = (completed: boolean) => {
      const replaced = scrollReplacePending;
      if (replaced) scrollReplacePending = false;
      cleanup();
      if (completed) {
        const finalTop = resolveTargetTop?.() ?? top;
        scrollEl.scrollTop = clamp(
          finalTop,
          0,
          Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight)
        );
      }
      playbackScrollMonitor.onAnimationEnd({
        completed,
        finalTop: scrollEl.scrollTop,
        replaced,
      });
      resolve();
    };

    playbackScrollAnimating = true;

    const tick = (now: number) => {
      if (isAborted(options) || controller.signal.aborted) {
        finish(false);
        return;
      }

      const progress = Math.min(1, (now - startTime) / duration);
      const currentTarget = resolveTargetTop?.() ?? top;
      scrollEl.scrollTop =
        startTop + (currentTarget - startTop) * easeOutCubic(progress);

      const frameMs = now - lastFrameTime;
      lastFrameTime = now;
      playbackScrollMonitor.onAnimationFrame({
        scrollTop: scrollEl.scrollTop,
        frameMs,
      });

      if (progress < 1) {
        activeScrollRaf = requestAnimationFrame(tick);
      } else {
        finish(true);
      }
    };

    activeScrollRaf = requestAnimationFrame(tick);
  });
}

export async function animateScrollElementIntoView(
  target: HTMLElement,
  options?: PlaybackScrollOptions & {
    scrollEl?: HTMLElement;
    align?: PlaybackScrollAlign;
    padding?: number;
  }
): Promise<void> {
  if (!target.isConnected) return;

  const scrollEl = options?.scrollEl ?? getPrototypeScrollRoot(target);
  if (!scrollEl || shouldSkipPrototypePageScroll(target, scrollEl)) return;

  const align = options?.align ?? "nearest";
  const padding = options?.padding ?? 0;

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
  if (isAborted(options)) return;

  const targetTop = computeScrollTopForElement(scrollEl, target, align, padding);
  await animateScrollTo(scrollEl, targetTop, {
    ...options,
    resolveTargetTop: () =>
      computeScrollTopForElement(scrollEl, target, align, padding),
  });
}
