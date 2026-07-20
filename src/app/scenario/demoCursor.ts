import defaultCursorUrl from "@/assets/default-cursor.svg";
import handIndexCursorUrl from "@/assets/hand-index-cursor.svg";
import {
  beginDemoTargetPageScroll,
  isDemoTargetInPrototypeView,
  isPrototypeOverlayTarget,
  isPrototypePageScrollLocked,
  revealDemoTargetForAgent,
  snapDemoTargetIntoView,
  type PlaybackScrollOptions,
} from "@/app/scenario/playbackScroll";
import { notePlaybackDemoClick } from "@/app/shell/playbackInteractionContext";
import {
  describeCursorTarget,
  noteCursorPathSample,
  notePlaybackCursorEvent,
} from "@/app/shell/playbackCursorDiagnostic";
import {
  playbackDiagClick,
  playbackDiagTarget,
} from "@/app/shell/playbackDiag";
import {
  isElementBlockedByModal,
  resolveClickTargetRespectingModal,
} from "@/app/shell/studioModalGuard";
import {
  DEMO_HOVER_CLASS,
  DEMO_PRESSED_CLASS,
  DEMO_ROBO_HOVER_ATTR,
  ensureDemoPseudoBridge,
} from "@/app/scenario/demoCursorPseudoBridge";
import {
  animate,
  MOTION_EASE_IN_OUT,
  type AnimationPlaybackControls,
} from "@/uxds/motion";

const CURSOR_ARROW_SVG = `<img class="proto-chat-demo-cursor__graphic proto-chat-demo-cursor__graphic--arrow" src="${defaultCursorUrl}" width="22" height="26" alt="" aria-hidden="true" draggable="false" />`;

const CURSOR_HAND_SVG = `<img class="proto-chat-demo-cursor__graphic proto-chat-demo-cursor__graphic--hand" src="${handIndexCursorUrl}" width="24" height="37" alt="" aria-hidden="true" draggable="false" />`;

const DEMO_CURSOR_MARKUP = `${CURSOR_ARROW_SVG}${CURSOR_HAND_SVG}`;

const CTA_TRAVEL_MS = 780;
/** Native-feel press: down → brief dwell → up → click (not instant synthetic). */
const CTA_PRESS_MS = 64;
const CTA_HOVER_DWELL_MS = 220;
const CURSOR_EXIT_MS = 1600;
const CURSOR_EXIT_DRIFT_PX = 10;
const CURSOR_FADE_MS = 480;
/** Parked robo-cursor in CJM — inset from the right edge, lower-right resting pose. */
const CURSOR_REST_RIGHT_INSET_RATIO = 0.08;
const CURSOR_REST_Y_RATIO = 0.54;
const CURSOR_PARK_DRIFT_PX = 20;
const CURSOR_PARK_TRAVEL_MS = 520;
/**
 * Shared tip hotspot — hand graphic is CSS-shifted so fingertip lands here
 * (same as arrow tip). Switching arrow↔hand must not move left/top.
 */
const CURSOR_HOTSPOT_X = 3;
const CURSOR_HOTSPOT_Y = 1;

export const DEMO_CLICK_EVENT = "studio-demo-click";
export const DEMO_CURSOR_PARKED_CLASS = "proto-chat-demo-cursor--parked";

export function notifyStudioDemoClick(): void {
  document.dispatchEvent(new CustomEvent(DEMO_CLICK_EVENT));
}

let lastCursorPos: { x: number; y: number } | null = null;
let activeHoverRoot: HTMLElement | null = null;
let journeyModePinned = false;
/** Manual CJM steps park after each interaction; cassette play leaves cursor on target. */
let parkAfterInteraction = false;
/**
 * PO: after a scripted click, stay visible at the click point — suppress
 * journey-park / idle park-away until the next travel or type-in park.
 */
let holdAtLastClick = false;
let parkPromise: Promise<void> | null = null;
let resizeParkListener: (() => void) | null = null;
let parkGeneration = 0;
/** Drifted park pose — reused until the cursor leaves rest for a director travel. */
let parkedRestAnchor: { left: number; top: number } | null = null;
/** Blue-diode journey end — fade robo-cursor after idle, revive on step back. */
export const JOURNEY_END_CURSOR_FADE_DELAY_MS = 5000;
let journeyEndFadeTimer: ReturnType<typeof setTimeout> | null = null;
let journeyEndFadeGeneration = 0;
let journeyEndCursorFaded = false;
let cursorFadeGeneration = 0;
/** Bumped on forceClear / remove — cancels in-flight Motion travel (Chrome hang guard). */
let travelGeneration = 0;
let activeTravelControls: AnimationPlaybackControls | null = null;
/**
 * After easeInOut travel settles on target, freeze left/top until the next travel.
 * Prevents on-target re-aim / chase while hover styles or scroll leftovers shift the rect.
 */
let cursorPosLocked = false;
/** Rate-limit synthetic pointer flood from hover bridge path. */
const SYNTHETIC_MOVE_MIN_MS = 48;
let lastSyntheticMoveAt = 0;
let lastSyntheticMoveKey = "";

function writeDemoCursorPos(
  cursor: HTMLElement,
  x: number,
  y: number,
  options?: { force?: boolean }
): void {
  if (cursorPosLocked && !options?.force) return;
  cursor.style.left = `${x}px`;
  cursor.style.top = `${y}px`;
}

export type RemoveDemoCursorOptions = {
  /** Hard-remove with no fade — aborts, resets, mode teardown. */
  immediate?: boolean;
  /** Fade out at the current position instead of parking. */
  fade?: boolean;
};

export function isDemoCursorJourneyModePinned(): boolean {
  return journeyModePinned;
}

export function shouldParkDemoCursorAfterInteraction(): boolean {
  return journeyModePinned && parkAfterInteraction;
}

export function isDemoCursorParked(): boolean {
  const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
  return cursor?.classList.contains(DEMO_CURSOR_PARKED_CLASS) ?? false;
}

export function waitForDemoCursorParked(): Promise<void> {
  return parkPromise ?? Promise.resolve();
}

export function isDemoCursorFadedAtJourneyEnd(): boolean {
  return journeyEndCursorFaded;
}

/** DOM snapshot for QA / MCP cursor eyes (opacity/display count as hidden). */
export function readDemoCursorDomState(): {
  visible: boolean;
  parked: boolean;
  faded: boolean;
  opacity: number | null;
  display: string | null;
  missing: boolean;
} {
  const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
  if (!cursor) {
    return {
      visible: false,
      parked: false,
      faded: journeyEndCursorFaded,
      opacity: null,
      display: null,
      missing: true,
    };
  }
  const exiting = cursor.classList.contains("proto-chat-demo-cursor--exit");
  const style = getComputedStyle(cursor);
  const opacity = Number.parseFloat(style.opacity);
  const display = style.display;
  const visibility = style.visibility;
  const opaque = Number.isFinite(opacity) ? opacity > 0.05 : true;
  const shown =
    display !== "none" && visibility !== "hidden" && opaque && !exiting;
  return {
    visible: shown,
    parked: isDemoCursorParked(),
    faded: journeyEndCursorFaded || exiting || !opaque,
    opacity: Number.isFinite(opacity) ? opacity : null,
    display,
    missing: false,
  };
}

/**
 * CJM type-in: keep robo-cursor visible at the ORIGINAL journey park rest.
 * Do not reseed onto the field (PO: not caret-ish, not ta.right+28).
 */
export function parkDemoCursorForTypeIn(
  target: HTMLElement,
  options?: { force?: boolean }
): void {
  if (!journeyModePinned) return;
  clearHoldAtLastClick();
  cancelDemoCursorJourneyEndFade();
  journeyEndCursorFaded = false;
  cancelDemoCursorTravel();
  const cursor = ensureDemoCursorElement();
  // Hold journey park pose — no slide as typed text lands.
  if (
    !options?.force &&
    cursor.classList.contains("proto-chat-demo-cursor--parked") &&
    parkedRestAnchor
  ) {
    applyDemoCursorParkedState(cursor);
    return;
  }
  const rest = resolveDemoCursorRestPosition();
  seedDemoCursorPosition(cursor, { x: rest.left, y: rest.top });
  applyDemoCursorParkedState(cursor);
  notePlaybackCursorEvent("park", {
    detail: "type-in-park",
    target: describeCursorTarget(target),
  });
}

/**
 * @deprecated PO: type-in cursor stays PARKED — no caret-slide.
 * Kept as park-only re-assert for any legacy callers.
 */
export function nudgeDemoCursorForTypeIn(
  target: HTMLElement,
  _chars: number
): void {
  parkDemoCursorForTypeIn(target);
}

export function cancelDemoCursorJourneyEndFade(): void {
  if (journeyEndFadeTimer != null) {
    clearTimeout(journeyEndFadeTimer);
    journeyEndFadeTimer = null;
  }
  journeyEndFadeGeneration += 1;
}

async function fadeOutDemoCursorAtJourneyEnd(generation: number): Promise<void> {
  if (!journeyModePinned || generation !== journeyEndFadeGeneration) return;

  cancelDemoCursorParkInFlight();
  clearDemoCtaStates();

  const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
  if (!cursor) {
    journeyEndCursorFaded = true;
    return;
  }

  const left = Number.parseFloat(cursor.style.left);
  const top = Number.parseFloat(cursor.style.top);
  if (Number.isFinite(left) && Number.isFinite(top)) {
    lastCursorPos = { x: left, y: top };
  }

  cursor.classList.add("proto-chat-demo-cursor--exit");
  notePlaybackCursorEvent("fade", { detail: "journey-end-idle" });
  await animateCursorFadeOnly(cursor);
  if (generation !== journeyEndFadeGeneration || !journeyModePinned) return;

  cursor.remove();
  journeyEndCursorFaded = true;
}

/** Start 5s idle timer after blue end diode — then drift/fade robo-cursor off. */
export function scheduleDemoCursorJourneyEndFade(
  delayMs = JOURNEY_END_CURSOR_FADE_DELAY_MS
): void {
  cancelDemoCursorJourneyEndFade();
  if (!journeyModePinned) return;

  const generation = journeyEndFadeGeneration;
  journeyEndFadeTimer = setTimeout(() => {
    journeyEndFadeTimer = null;
    void fadeOutDemoCursorAtJourneyEnd(generation);
  }, delayMs);
}

/** Step back from journey end — restore parked robo-cursor for the next director beat. */
export function reviveDemoCursorAfterJourneyEndRetreat(): void {
  cancelDemoCursorJourneyEndFade();
  journeyEndCursorFaded = false;
  if (!journeyModePinned) return;

  parkedRestAnchor = null;
  void parkDemoCursorAtRest({ animate: false });
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function resolveDemoCursorRestPosition(options?: {
  /** When true, sample a new drift offset even if a park pose already exists. */
  resample?: boolean;
}): { left: number; top: number } {
  if (parkedRestAnchor && !options?.resample) {
    return parkedRestAnchor;
  }
  const baseLeft = Math.round(
    window.innerWidth * (1 - CURSOR_REST_RIGHT_INSET_RATIO) - 37
  );
  const baseTop = Math.round(window.innerHeight * CURSOR_REST_Y_RATIO);
  const driftX = randomInRange(-CURSOR_PARK_DRIFT_PX, CURSOR_PARK_DRIFT_PX);
  const driftY = randomInRange(-CURSOR_PARK_DRIFT_PX, CURSOR_PARK_DRIFT_PX);
  const margin = 16;
  const next = {
    left: Math.round(
      Math.max(margin, Math.min(window.innerWidth - 37 - margin, baseLeft + driftX))
    ),
    top: Math.round(
      Math.max(margin, Math.min(window.innerHeight - 40 - margin, baseTop + driftY))
    ),
  };
  parkedRestAnchor = next;
  return next;
}

function cancelDemoCursorParkInFlight(): void {
  parkGeneration += 1;
  parkPromise = null;
}

/** Abort in-flight Motion cursor travel — call from forceClear / remove / teardown. */
export function cancelDemoCursorTravel(): void {
  travelGeneration += 1;
  cursorPosLocked = false;
  if (activeTravelControls) {
    activeTravelControls.stop();
    activeTravelControls = null;
  }
}

function prepareDemoCursorForTravel(cursor: HTMLElement): { x: number; y: number } {
  const wasParked = cursor.classList.contains(DEMO_CURSOR_PARKED_CLASS);
  cursorFadeGeneration += 1;
  parkedRestAnchor = null;
  cursor.classList.remove(
    DEMO_CURSOR_PARKED_CLASS,
    "proto-chat-demo-cursor--exit",
    "proto-chat-demo-cursor--tap"
  );
  if (wasParked) {
    notePlaybackCursorEvent("unpark", { detail: "director-travel" });
  }
  cursor.style.opacity = "1";
  cursor.style.transition = "none";
  const pos = readCursorPosition();
  if (pos) {
    lastCursorPos = pos;
    return pos;
  }
  const rect = cursor.getBoundingClientRect();
  const seeded = { x: Math.round(rect.left), y: Math.round(rect.top) };
  seedDemoCursorPosition(cursor, seeded);
  return seeded;
}

function ensureDemoCursorElement(): HTMLElement {
  const existing = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
  if (existing) return existing;

  const cursor = document.createElement("div");
  cursor.className = "proto-chat-demo-cursor";
  cursor.innerHTML = DEMO_CURSOR_MARKUP;
  document.body.appendChild(cursor);
  return cursor;
}

function applyDemoCursorParkedState(cursor: HTMLElement): void {
  clearDemoCtaStates();
  cursor.classList.remove(
    "proto-chat-demo-cursor--exit",
    "proto-chat-demo-cursor--tap",
    "proto-chat-demo-cursor--pointer"
  );
  cursor.classList.add(DEMO_CURSOR_PARKED_CLASS);
  cursor.style.opacity = "1";
  setDemoCursorPointerMode(false);
}

function seedDemoCursorPosition(
  cursor: HTMLElement,
  position: { x: number; y: number }
): void {
  cursor.style.transition = "none";
  cursorPosLocked = false;
  writeDemoCursorPos(cursor, position.x, position.y, { force: true });
  lastCursorPos = { x: position.x, y: position.y };
}

function resolveDemoCursorSeedPosition(): { x: number; y: number } {
  const current = readCursorPosition();
  if (current) return current;
  if (lastCursorPos) return lastCursorPos;
  const rest = resolveDemoCursorRestPosition();
  return { x: rest.left, y: rest.top };
}

function clearHoldAtLastClick(): void {
  holdAtLastClick = false;
}

export function isDemoCursorHeldAtLastClick(): boolean {
  return holdAtLastClick;
}

/** CJM idle pose — visible on the right, waiting for the next director call. */
export function parkDemoCursorAtRest(options?: {
  animate?: boolean;
}): Promise<void> {
  if (!journeyModePinned) {
    return Promise.resolve();
  }
  // Post-click hold wins over idle journey-park (SF ends → parkAfterInteraction).
  if (holdAtLastClick) {
    retainDemoCursorInPlace();
    notePlaybackCursorEvent("park", {
      animated: false,
      detail: "suppressed-hold-at-last-click",
    });
    return Promise.resolve();
  }
  if (parkPromise) return parkPromise;

  notePlaybackCursorEvent("park", {
    animated: options?.animate ?? false,
    detail: journeyModePinned ? "journey-park" : "legacy-fade-path",
  });

  const generation = parkGeneration;
  const run = async () => {
    const cursor = ensureDemoCursorElement();
    const startX = Number.parseFloat(cursor.style.left);
    const startY = Number.parseFloat(cursor.style.top);
    const hasStart = Number.isFinite(startX) && Number.isFinite(startY);
    const alreadyParked = cursor.classList.contains(DEMO_CURSOR_PARKED_CLASS);

    if (alreadyParked && hasStart) {
      applyDemoCursorParkedState(cursor);
      seedDemoCursorPosition(cursor, { x: startX, y: startY });
      parkedRestAnchor = { left: startX, top: startY };
      lastCursorPos = { x: startX, y: startY };
      return;
    }

    const rest = resolveDemoCursorRestPosition({ resample: true });

    if (!hasStart) {
      seedDemoCursorPosition(cursor, { x: rest.left, y: rest.top });
      applyDemoCursorParkedState(cursor);
      return;
    }

    if (options?.animate) {
      applyDemoCursorParkedState(cursor);
      const moved = await animateCursorTravel(
        cursor,
        startX,
        startY,
        rest.left,
        rest.top,
        CURSOR_PARK_TRAVEL_MS,
        { shouldAbort: () => parkGeneration !== generation }
      );
      if (!moved) {
        if (parkGeneration !== generation) return;
        seedDemoCursorPosition(cursor, { x: rest.left, y: rest.top });
      }
    } else {
      seedDemoCursorPosition(cursor, { x: rest.left, y: rest.top });
      applyDemoCursorParkedState(cursor);
    }

    if (parkGeneration !== generation) return;
    lastCursorPos = { x: rest.left, y: rest.top };
    parkedRestAnchor = { left: rest.left, top: rest.top };
  };

  parkPromise = run().finally(() => {
    parkPromise = null;
  });
  return parkPromise;
}

export function setDemoCursorJourneyMode(
  active: boolean,
  options?: { parkAfterInteraction?: boolean }
): void {
  const wasActive = journeyModePinned;
  const wasParkAfterInteraction = parkAfterInteraction;

  journeyModePinned = active;
  if (options?.parkAfterInteraction !== undefined) {
    parkAfterInteraction = options.parkAfterInteraction;
  } else if (!active) {
    parkAfterInteraction = false;
  } else {
    parkAfterInteraction = true;
  }

  if (resizeParkListener) {
    window.removeEventListener("resize", resizeParkListener);
    resizeParkListener = null;
  }

  if (!active) {
    cancelDemoCursorJourneyEndFade();
    journeyEndCursorFaded = false;
    parkedRestAnchor = null;
    return;
  }

  if (!wasActive) {
    parkedRestAnchor = null;
    void parkDemoCursorAtRest();
  } else if (!wasParkAfterInteraction && parkAfterInteraction) {
    // Manual CJM idle — park visibly at rest; do not fade out (that removed the cursor).
    void parkDemoCursorAtRest({ animate: true });
  } else if (parkAfterInteraction && !journeyEndCursorFaded) {
    // Idempotent remount: restart / setJourneyMode(true) while already-on can wipe the
    // DOM node without flipping React state — CJM on = robo time, park must stay visible.
    const existing = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
    if (!existing) {
      void parkDemoCursorAtRest({ animate: false });
    } else {
      existing.classList.remove("proto-chat-demo-cursor--exit");
      applyDemoCursorParkedState(existing);
      if (!Number.isFinite(Number.parseFloat(existing.style.left))) {
        const rest = resolveDemoCursorRestPosition();
        seedDemoCursorPosition(existing, { x: rest.left, y: rest.top });
      }
    }
  }

  resizeParkListener = () => {
    if (journeyModePinned && parkAfterInteraction && !journeyEndCursorFaded) {
      parkedRestAnchor = null;
      void parkDemoCursorAtRest();
    }
  };
  window.addEventListener("resize", resizeParkListener);
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function resetDemoCursorTravelOrigin(): void {
  if (journeyModePinned) {
    const current = readCursorPosition();
    if (current) {
      lastCursorPos = current;
      return;
    }
    const rest = resolveDemoCursorRestPosition();
    lastCursorPos = { x: rest.left, y: rest.top };
    return;
  }
  lastCursorPos = null;
  parkedRestAnchor = null;
}

function cursorHotspotFromPos(left: number, top: number): { x: number; y: number } {
  return { x: left + CURSOR_HOTSPOT_X, y: top + CURSOR_HOTSPOT_Y };
}

function hotspotIntersectsElement(
  hotspotX: number,
  hotspotY: number,
  element: HTMLElement
): boolean {
  const rect = element.getBoundingClientRect();
  return (
    hotspotX >= rect.left &&
    hotspotX <= rect.right &&
    hotspotY >= rect.top &&
    hotspotY <= rect.bottom
  );
}

async function animateCursorTravel(
  cursor: HTMLElement,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  durationMs: number,
  options?: {
    /** Re-read end position while page scroll is in progress (frozen near arrival). */
    trackTarget?: HTMLElement;
    shouldAbort?: () => boolean;
  }
): Promise<boolean> {
  const generation = travelGeneration;
  const aborted = () =>
    generation !== travelGeneration || !!options?.shouldAbort?.();

  // Unlock for this travel; freeze again only after settle.
  cursorPosLocked = false;
  let frozenEndX = endX;
  let frozenEndY = endY;
  let tracking = Boolean(options?.trackTarget);

  const resolveEnd = () => {
    if (tracking && options?.trackTarget) {
      const tracked = cursorPositionForTarget(options.trackTarget);
      frozenEndX = tracked.left;
      frozenEndY = tracked.top;
    }
    return { x: frozenEndX, y: frozenEndY };
  };

  cursor.style.transition = "none";
  noteCursorPathSample("travel", startX, startY);
  if (aborted()) return false;

  // Motion tween — ease-in-out only (light touch). No spring / back / overshoot.
  // Hover is applied AFTER settle (not mid-travel) so CTA layout shifts cannot re-aim.
  let controls!: AnimationPlaybackControls;
  controls = animate(0, 1, {
    duration: Math.max(0.001, durationMs / 1000),
    ease: MOTION_EASE_IN_OUT,
    onUpdate: (progress) => {
      if (aborted()) {
        controls.stop();
        return;
      }
      // Freeze tracking before the last segment so hover/layout cannot chase the tip.
      if (progress >= 0.9) tracking = false;
      const end = resolveEnd();
      const x = startX + (end.x - startX) * progress;
      const y = startY + (end.y - startY) * progress;
      if (cursor.isConnected) {
        writeDemoCursorPos(cursor, x, y, { force: true });
      }
      noteCursorPathSample("travel", x, y);
    },
  });
  activeTravelControls = controls;

  try {
    await controls;
  } finally {
    if (activeTravelControls === controls) {
      activeTravelControls = null;
    }
  }

  if (aborted()) {
    return false;
  }

  const finalEnd = resolveEnd();
  if (cursor.isConnected) {
    writeDemoCursorPos(cursor, finalEnd.x, finalEnd.y, { force: true });
  }
  lastCursorPos = { x: finalEnd.x, y: finalEnd.y };
  cursorPosLocked = true;
  noteCursorPathSample("settle", finalEnd.x, finalEnd.y);
  notePlaybackCursorEvent("settle", {
    target: options?.trackTarget
      ? describeCursorTarget(options.trackTarget)
      : undefined,
    animated: true,
    detail: "on-target-lock",
  });
  return true;
}

async function animateCursorFadeOnly(cursor: HTMLElement): Promise<void> {
  cursor.style.transition = "none";
  cursor.style.opacity = "1";
  const start = performance.now();

  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / CURSOR_FADE_MS);
      const eased = easeOutCubic(t);
      cursor.style.opacity = String(Math.max(0, 1 - eased));
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

async function animateCursorExit(
  cursor: HTMLElement,
  startX: number,
  startY: number
): Promise<void> {
  const driftX =
    startX +
    randomInRange(CURSOR_EXIT_DRIFT_PX * 0.4, CURSOR_EXIT_DRIFT_PX) *
      (Math.random() > 0.5 ? 1 : -1);
  const driftY =
    startY +
    randomInRange(CURSOR_EXIT_DRIFT_PX * 0.4, CURSOR_EXIT_DRIFT_PX) *
      (Math.random() > 0.5 ? 1 : -1);

  cursor.style.transition = "none";
  cursor.style.opacity = "1";
  const start = performance.now();

  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / CURSOR_EXIT_MS);
      const driftE = easeOutCubic(Math.min(1, t * 1.35));
      cursor.style.left = `${startX + (driftX - startX) * driftE}px`;
      cursor.style.top = `${startY + (driftY - startY) * driftE}px`;
      const fadeT = Math.max(0, (t - 0.2) / 0.8);
      const fadeE = fadeT * fadeT;
      cursor.style.opacity = String(Math.max(0, 1 - fadeE));
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

function readCursorPosition(): { x: number; y: number } | null {
  const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
  if (!cursor) return null;
  const left = Number.parseFloat(cursor.style.left);
  const top = Number.parseFloat(cursor.style.top);
  if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
  return { x: left, y: top };
}

function retainDemoCursorInPlace(): void {
  clearDemoCtaStates();
  const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
  if (!cursor) return;
  cursor.classList.remove(
    DEMO_CURSOR_PARKED_CLASS,
    "proto-chat-demo-cursor--exit",
    "proto-chat-demo-cursor--tap"
  );
  cursor.style.opacity = "1";
  setDemoCursorPointerMode(false);
  const pos = readCursorPosition();
  if (pos) lastCursorPos = pos;
}

/**
 * PO: after a CJM click, keep the robo-cursor visible at the click point —
 * no fade, no park-away to journey rest. Next travel / type-in park may move it.
 */
export function holdDemoCursorAtLastClick(): void {
  if (!journeyModePinned) return;
  cancelDemoCursorTravel();
  cancelDemoCursorJourneyEndFade();
  cancelDemoCursorParkInFlight();
  cursorFadeGeneration += 1;
  holdAtLastClick = true;
  const cursor = ensureDemoCursorElement();
  const pos = readCursorPosition() ?? lastCursorPos;
  if (pos) {
    seedDemoCursorPosition(cursor, pos);
    lastCursorPos = pos;
  }
  cursor.classList.remove(
    DEMO_CURSOR_PARKED_CLASS,
    "proto-chat-demo-cursor--exit",
    "proto-chat-demo-cursor--tap"
  );
  cursor.style.opacity = "1";
  setDemoCursorPointerMode(false);
  cursorPosLocked = true;
  notePlaybackCursorEvent("settle", {
    detail: "hold-at-last-click",
  });
}

function acquireDemoCursorElement(): HTMLElement {
  if (journeyModePinned) {
    const existing = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
    if (existing) {
      existing.style.opacity = "1";
      if (!Number.isFinite(Number.parseFloat(existing.style.left))) {
        seedDemoCursorPosition(existing, resolveDemoCursorSeedPosition());
      }
      return existing;
    }
  } else {
    document
      .querySelectorAll<HTMLElement>(".proto-chat-demo-cursor")
      .forEach((el) => el.remove());
  }

  const cursor = document.createElement("div");
  cursor.className = "proto-chat-demo-cursor";
  cursor.innerHTML = DEMO_CURSOR_MARKUP;
  document.body.appendChild(cursor);
  if (journeyModePinned) {
    seedDemoCursorPosition(cursor, resolveDemoCursorSeedPosition());
  }
  return cursor;
}

function resolveCursorStart(endX: number, endY: number): { x: number; y: number } {
  const current = readCursorPosition();
  if (current) return current;

  if (lastCursorPos) {
    if (journeyModePinned) {
      return { x: lastCursorPos.x, y: lastCursorPos.y };
    }
    const jitter = randomInRange(6, 18);
    const angle = randomInRange(0, Math.PI * 2);
    return {
      x: lastCursorPos.x + Math.cos(angle) * jitter,
      y: lastCursorPos.y + Math.sin(angle) * jitter,
    };
  }

  if (journeyModePinned) {
    const rest = resolveDemoCursorRestPosition();
    return { x: rest.left, y: rest.top };
  }

  const distance = randomInRange(120, 210);
  const angle = randomInRange(-Math.PI * 0.85, Math.PI * 0.35);
  return {
    x: endX + Math.cos(angle) * distance,
    y: endY + Math.sin(angle) * distance,
  };
}

const FIELD_INTERACTION_SELECTORS = [
  '[data-name="component.input.field"]',
  ".proto-search-field",
  ".proto-avail-field",
];

const BUTTON_INTERACTION_SELECTORS = [
  '[data-name="component.input.button"]',
  "button",
  ".proto-popup-close",
  ".studio-tertiary-cta",
  ".proto-avail-tertiary",
  ".proto-avail-btn-primary",
  ".proto-avail-btn-secondary",
  ".proto-header-avatar",
  "a.proto-link",
  ".proto-link",
  'a[role="button"]',
  '[role="button"]',
];

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function clearDemoCtaStates(): void {
  lastSyntheticMoveAt = 0;
  lastSyntheticMoveKey = "";
  document
    .querySelectorAll<HTMLElement>(
      `.${DEMO_HOVER_CLASS}, .${DEMO_PRESSED_CLASS}, [${DEMO_ROBO_HOVER_ATTR}]`
    )
    .forEach((el) => {
      el.classList.remove(DEMO_HOVER_CLASS, DEMO_PRESSED_CLASS);
      el.removeAttribute(DEMO_ROBO_HOVER_ATTR);
    });
  document
    .querySelectorAll<HTMLElement>(".proto-demo-avatar-hover")
    .forEach((el) => el.classList.remove("proto-demo-avatar-hover"));
  activeHoverRoot = null;
  setDemoCursorPointerMode(false);
}

function setDemoCursorPointerMode(active: boolean): void {
  document.querySelectorAll<HTMLElement>(".proto-chat-demo-cursor").forEach((cursor) => {
    cursor.classList.toggle("proto-chat-demo-cursor--pointer", active);
  });
}

/** QA / MCP — true when robo-cursor shows hand/pointer graphic. */
export function isDemoCursorPointerMode(): boolean {
  const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
  return cursor?.classList.contains("proto-chat-demo-cursor--pointer") ?? false;
}

function leaveDemoInteractionRoot(
  root: HTMLElement,
  coords?: { x: number; y: number }
): void {
  root.classList.remove(DEMO_HOVER_CLASS, DEMO_PRESSED_CLASS);
  root.removeAttribute(DEMO_ROBO_HOVER_ATTR);
  if (!root.isConnected) return;
  const c = coords ?? targetCenter(root);
  dispatchDemoPointerLeave(root, c.x, c.y);
}

function setDemoInteractionHover(
  root: HTMLElement | null,
  active: boolean,
  coords?: { x: number; y: number }
): void {
  ensureDemoPseudoBridge();

  if (!active) {
    if (activeHoverRoot) {
      leaveDemoInteractionRoot(activeHoverRoot, coords);
    } else if (root) {
      leaveDemoInteractionRoot(root, coords);
    }
    activeHoverRoot = null;
    setDemoCursorPointerMode(false);
    return;
  }

  if (!root) {
    if (activeHoverRoot) leaveDemoInteractionRoot(activeHoverRoot, coords);
    activeHoverRoot = null;
    setDemoCursorPointerMode(false);
    return;
  }

  if (activeHoverRoot && activeHoverRoot !== root) {
    leaveDemoInteractionRoot(activeHoverRoot, coords);
  }

  const c = coords ?? targetCenter(root);
  const already = activeHoverRoot === root && root.classList.contains(DEMO_HOVER_CLASS);
  activeHoverRoot = root;
  setDemoCursorPointerMode(true);
  root.classList.add(DEMO_HOVER_CLASS);
  root.setAttribute(DEMO_ROBO_HOVER_ATTR, "true");
  // Already hovering: keep class; do NOT re-flood enter/move (hang guard).
  if (already) return;
  dispatchDemoPointerEnter(root, c.x, c.y);
}

function clearDemoCursorImmediate(): void {
  cancelDemoCursorTravel();
  cancelDemoCursorJourneyEndFade();
  cancelDemoCursorParkInFlight();
  cursorFadeGeneration += 1;
  cursorPosLocked = false;
  clearHoldAtLastClick();
  notePlaybackCursorEvent("remove", { detail: "immediate" });
  document
    .querySelectorAll<HTMLElement>(".proto-chat-demo-cursor")
    .forEach((el) => el.remove());
  clearDemoCtaStates();
  if (!journeyModePinned) {
    lastCursorPos = null;
    parkedRestAnchor = null;
  }
}

/** Fade the robo-cursor out at its current position — no park teleport. */
export async function fadeOutDemoCursorInPlace(): Promise<void> {
  notePlaybackCursorEvent("fade", { detail: "in-place" });
  const generation = ++cursorFadeGeneration;
  cancelDemoCursorParkInFlight();
  clearDemoCtaStates();

  const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
  if (!cursor) return;

  const left = Number.parseFloat(cursor.style.left);
  const top = Number.parseFloat(cursor.style.top);
  if (Number.isFinite(left) && Number.isFinite(top)) {
    lastCursorPos = { x: left, y: top };
  }

  cursor.classList.add("proto-chat-demo-cursor--exit");
  await animateCursorFadeOnly(cursor);
  if (generation !== cursorFadeGeneration) return;

  cursor.remove();
  if (!journeyModePinned) {
    lastCursorPos = null;
    parkedRestAnchor = null;
  }
}

export function removeDemoCursor(options?: RemoveDemoCursorOptions): void {
  if (options?.immediate) {
    // During post-click hold, abort-all from other modules should not rip cursor.
    // Only explicit chat prelude abort (which checks hold first) or mode teardown clears.
    if (holdAtLastClick && journeyModePinned) {
      notePlaybackCursorEvent("settle", {
        detail: "hold-at-last-click · immediate-suppressed",
      });
      return;
    }
    clearDemoCursorImmediate();
    return;
  }
  // Post-click hold: never fade/park-away from a soft remove.
  if (holdAtLastClick && !options?.fade) {
    retainDemoCursorInPlace();
    notePlaybackCursorEvent("settle", {
      detail: "hold-at-last-click · soft-remove-suppressed",
    });
    return;
  }
  if (options?.fade) {
    clearHoldAtLastClick();
    void fadeOutDemoCursorInPlace();
    return;
  }
  if (journeyModePinned) {
    if (parkAfterInteraction) {
      void parkDemoCursorAtRest({ animate: true });
      return;
    }
    void fadeOutDemoCursorInPlace();
    return;
  }
  void fadeOutDemoCursorInPlace();
}

/** End of a director script — await before advancing beats in manual CJM. */
export async function releaseDemoCursorAfterScript(): Promise<void> {
  if (holdAtLastClick) {
    retainDemoCursorInPlace();
    notePlaybackCursorEvent("release", {
      detail: "hold-at-last-click",
    });
    return;
  }
  notePlaybackCursorEvent("release", {
    detail: parkAfterInteraction ? "park-after-script" : "retain-in-place",
  });
  if (!journeyModePinned) {
    await fadeOutDemoCursorInPlace();
    return;
  }
  if (parkAfterInteraction) {
    await parkDemoCursorAtRest({ animate: true });
    return;
  }
  retainDemoCursorInPlace();
}

/**
 * After a scripted click — clear press/tap + return cursor graphic to default
 * immediately (native unfocus / leave-clickable feel). Do not keep hand/pointer.
 */
export function settleDemoCursorAfterClick(
  cursor: HTMLElement,
  interactionRoot?: HTMLElement | null
): void {
  cursor.classList.remove("proto-chat-demo-cursor--tap");
  cursor.classList.remove(DEMO_CURSOR_PARKED_CLASS);
  if (interactionRoot) {
    interactionRoot.classList.remove(DEMO_PRESSED_CLASS);
    setDemoInteractionHover(interactionRoot, false);
  } else {
    setDemoCursorPointerMode(false);
  }
  const left = Number.parseFloat(cursor.style.left);
  const top = Number.parseFloat(cursor.style.top);
  if (Number.isFinite(left) && Number.isFinite(top)) {
    lastCursorPos = { x: left, y: top };
  }
}

/** Scripted playback end — fade cursor out in place (unless CJM manual park applies). */
export async function exitDemoCursor(): Promise<void> {
  if (journeyModePinned) {
    if (parkAfterInteraction) {
      await fadeOutDemoCursorInPlace();
      return;
    }
    retainDemoCursorInPlace();
    return;
  }

  await fadeOutDemoCursorInPlace();
  resetDemoCursorTravelOrigin();
}

export function clearSimulatedClickRipples(): void {
  document
    .querySelectorAll<HTMLElement>(".proto-sim-click")
    .forEach((el) => el.remove());
}

function matchesAny(el: Element, selectors: string[]): boolean {
  return selectors.some((selector) => el.matches(selector));
}

export function findDemoInteractionRoot(target: HTMLElement): HTMLElement {
  let node: HTMLElement | null = target;
  while (node) {
    if (matchesAny(node, BUTTON_INTERACTION_SELECTORS)) return node;
    node = node.parentElement;
  }

  node = target;
  while (node) {
    if (matchesAny(node, FIELD_INTERACTION_SELECTORS)) return node;
    node = node.parentElement;
  }

  return target;
}

function demoPointerInit(
  x: number,
  y: number,
  options?: { buttons?: number; button?: number; bubbles?: boolean }
): PointerEventInit {
  return {
    bubbles: options?.bubbles !== false,
    cancelable: true,
    view: window,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    button: options?.button ?? 0,
    buttons: options?.buttons ?? 0,
  };
}

function demoMouseInit(
  x: number,
  y: number,
  options?: { buttons?: number; button?: number; bubbles?: boolean }
): MouseEventInit {
  return {
    bubbles: options?.bubbles !== false,
    cancelable: true,
    view: window,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    button: options?.button ?? 0,
    buttons: options?.buttons ?? 0,
  };
}

function allowSyntheticMove(target: HTMLElement, x: number, y: number): boolean {
  const now =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  const key = `${target === activeHoverRoot ? "h" : "t"}:${Math.round(x)}:${Math.round(y)}`;
  if (
    key === lastSyntheticMoveKey &&
    now - lastSyntheticMoveAt < SYNTHETIC_MOVE_MIN_MS
  ) {
    return false;
  }
  lastSyntheticMoveKey = key;
  lastSyntheticMoveAt = now;
  return true;
}

/** Enter + over + move — drives React hover handlers; classes bridge CSS :hover. */
function dispatchDemoPointerEnter(target: HTMLElement, x: number, y: number): void {
  if (!target.isConnected) return;
  const move = demoPointerInit(x, y, { buttons: 0, button: -1 });
  const mouseMove = demoMouseInit(x, y, { buttons: 0, button: -1 });
  target.dispatchEvent(new PointerEvent("pointerover", move));
  target.dispatchEvent(
    new PointerEvent("pointerenter", { ...move, bubbles: false })
  );
  target.dispatchEvent(new MouseEvent("mouseover", mouseMove));
  target.dispatchEvent(
    new MouseEvent("mouseenter", { ...mouseMove, bubbles: false })
  );
  // One move with enter is enough — do not let callers re-enter flood.
  lastSyntheticMoveKey = `h:${Math.round(x)}:${Math.round(y)}`;
  lastSyntheticMoveAt =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  target.dispatchEvent(
    new PointerEvent("pointermove", demoPointerInit(x, y, { buttons: 0, button: -1 }))
  );
  target.dispatchEvent(
    new MouseEvent("mousemove", demoMouseInit(x, y, { buttons: 0, button: -1 }))
  );
}

function dispatchDemoPointerMove(target: HTMLElement, x: number, y: number): void {
  if (!target.isConnected) return;
  if (!allowSyntheticMove(target, x, y)) return;
  target.dispatchEvent(
    new PointerEvent("pointermove", demoPointerInit(x, y, { buttons: 0, button: -1 }))
  );
  target.dispatchEvent(
    new MouseEvent("mousemove", demoMouseInit(x, y, { buttons: 0, button: -1 }))
  );
}

function dispatchDemoPointerDown(target: HTMLElement, x: number, y: number): void {
  target.dispatchEvent(
    new PointerEvent("pointerdown", demoPointerInit(x, y, { buttons: 1, button: 0 }))
  );
  target.dispatchEvent(
    new MouseEvent("mousedown", demoMouseInit(x, y, { buttons: 1, button: 0 }))
  );
}

function dispatchDemoPointerUp(target: HTMLElement, x: number, y: number): void {
  target.dispatchEvent(
    new PointerEvent("pointerup", demoPointerInit(x, y, { buttons: 0, button: 0 }))
  );
  target.dispatchEvent(
    new MouseEvent("mouseup", demoMouseInit(x, y, { buttons: 0, button: 0 }))
  );
}

function dispatchDemoPointerLeave(target: HTMLElement, x: number, y: number): void {
  const init = demoPointerInit(x, y, { buttons: 0, button: -1 });
  const mouse = demoMouseInit(x, y, { buttons: 0, button: -1 });
  target.dispatchEvent(new PointerEvent("pointerout", init));
  target.dispatchEvent(
    new PointerEvent("pointerleave", { ...init, bubbles: false })
  );
  target.dispatchEvent(new MouseEvent("mouseout", mouse));
  target.dispatchEvent(
    new MouseEvent("mouseleave", { ...mouse, bubbles: false })
  );
}

function tapDemoCursor(cursor: HTMLElement): void {
  cursor.classList.remove("proto-chat-demo-cursor--tap");
  void cursor.offsetWidth;
  cursor.classList.add("proto-chat-demo-cursor--tap");
}

export function isClickableTarget(target: HTMLElement): boolean {
  if (!target.isConnected) return false;
  const rect = target.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;
  const style = window.getComputedStyle(target);
  if (style.display === "none" || style.visibility === "hidden") return false;
  // Empty opacity string → Number("") === 0 in JS; treat as fully visible.
  const opacity =
    style.opacity === "" || style.opacity == null
      ? 1
      : Number(style.opacity);
  if (Number.isFinite(opacity) && opacity === 0) return false;
  return true;
}

export function targetCenter(target: HTMLElement): { x: number; y: number } {
  const rect = target.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function cursorPositionForTarget(target: HTMLElement): { left: number; top: number } {
  const { x, y } = targetCenter(target);
  return {
    left: x - CURSOR_HOTSPOT_X,
    top: y - CURSOR_HOTSPOT_Y,
  };
}

export async function moveDemoCursorTo(
  target: HTMLElement,
  options?: {
    applyHover?: boolean;
    syncPageScroll?: boolean;
    shouldAbort?: () => boolean;
  }
): Promise<HTMLElement | null> {
  const travelToken = travelGeneration;
  const travelAborted = () =>
    travelToken !== travelGeneration || !!options?.shouldAbort?.();

  const bail = async (): Promise<null> => {
    notePlaybackCursorEvent("abort", {
      target: describeCursorTarget(target),
      abortReason: options?.shouldAbort?.()
        ? "shouldAbort"
        : travelToken !== travelGeneration
          ? "travel-cancelled"
          : "travel-incomplete",
    });
    await releaseDemoCursorAfterScript();
    return null;
  };

  if (travelAborted()) return bail();

  // New director travel supersedes post-click hold.
  clearHoldAtLastClick();
  cancelDemoCursorParkInFlight();

  const interactionRoot = findDemoInteractionRoot(target);
  const applyHover = options?.applyHover !== false;
  const syncPageScroll =
    options?.syncPageScroll !== false &&
    !isPrototypePageScrollLocked() &&
    !isPrototypeOverlayTarget(target);

  const scrollOpts: PlaybackScrollOptions = {
    shouldAbort: () => travelAborted(),
  };
  let scrollDurationMs = 0;
  let scrollPromise: Promise<void> = Promise.resolve();
  if (syncPageScroll) {
    // Always bring the target into the prototype viewport before travel so
    // PO can see below-fold work while agent-testing clicks are blocked.
    const began = await beginDemoTargetPageScroll(target, scrollOpts);
    scrollDurationMs = began.durationMs;
    scrollPromise = began.scrollPromise;
    if (
      scrollDurationMs === 0 &&
      !isDemoTargetInPrototypeView(target)
    ) {
      snapDemoTargetIntoView(target);
      notePlaybackCursorEvent("scroll-into-view", {
        target: describeCursorTarget(target),
        animated: false,
        scroll: true,
        detail: "snap-into-view",
      });
    } else if (scrollDurationMs > 0) {
      notePlaybackCursorEvent("scroll-into-view", {
        target: describeCursorTarget(target),
        animated: true,
        scroll: true,
        detail: `sync-page-scroll ${scrollDurationMs}ms`,
      });
    }
  }

  if (travelAborted()) return bail();

  const cursor = acquireDemoCursorElement();

  const end = cursorPositionForTarget(target);
  const endX = end.left;
  const endY = end.top;
  const travelStart = journeyModePinned
    ? prepareDemoCursorForTravel(cursor)
    : resolveCursorStart(endX, endY);

  cursorPosLocked = false;
  writeDemoCursorPos(cursor, travelStart.x, travelStart.y, { force: true });

  await delay(randomInRange(24, 72));
  if (travelAborted()) return bail();

  const cursorBaseMs = CTA_TRAVEL_MS * randomInRange(0.88, 1.14);
  const durationMs = Math.max(cursorBaseMs, scrollDurationMs);

  const traveled = await animateCursorTravel(
    cursor,
    travelStart.x,
    travelStart.y,
    endX,
    endY,
    durationMs,
    {
      // Track only while a real page scroll is running; frozen ≥90% progress.
      trackTarget: syncPageScroll && scrollDurationMs > 0 ? target : undefined,
      shouldAbort: () => travelAborted(),
    }
  );
  await scrollPromise;
  if (!traveled || travelAborted()) return bail();

  notePlaybackCursorEvent("travel", {
    target: describeCursorTarget(target),
    animated: true,
    detail: applyHover ? "with-hover" : "no-hover",
  });

  // Hover after settle — native light-touch; no mid-travel re-aim from layout shift.
  if (applyHover) {
    setDemoInteractionHover(interactionRoot, true);
  }
  await delay(32);
  if (travelAborted()) return bail();
  return cursor;
}

export async function simulateDemoPointerHover(
  target: HTMLElement,
  dwellMs: number,
  options?: {
    shouldAbort?: () => boolean;
    scroll?: boolean;
    onHoverStart?: (interactionRoot: HTMLElement) => void;
    onHoverEnd?: () => void;
  }
): Promise<boolean> {
  if (options?.shouldAbort?.()) return false;

  if (options?.shouldAbort?.()) return false;
  if (!isClickableTarget(target)) return false;

  if (options?.scroll !== false) {
    await revealDemoTargetForAgent(target, {
      shouldAbort: options?.shouldAbort,
    });
  }

  const interactionRoot = findDemoInteractionRoot(target);
  const cursor = await moveDemoCursorTo(target, {
    shouldAbort: options?.shouldAbort,
    syncPageScroll: options?.scroll !== false,
  });
  if (!cursor || options?.shouldAbort?.()) {
    await releaseDemoCursorAfterScript();
    return false;
  }

  options?.onHoverStart?.(interactionRoot);
  notePlaybackCursorEvent("hover-dwell", {
    target: describeCursorTarget(interactionRoot),
    detail: `${dwellMs}ms`,
  });
  await delay(dwellMs);
  if (options?.shouldAbort?.()) {
    options?.onHoverEnd?.();
    await releaseDemoCursorAfterScript();
    return false;
  }

  options?.onHoverEnd?.();
  setDemoInteractionHover(interactionRoot, false);
  const left = Number.parseFloat(
    document.querySelector<HTMLElement>(".proto-chat-demo-cursor")?.style.left ?? ""
  );
  const top = Number.parseFloat(
    document.querySelector<HTMLElement>(".proto-chat-demo-cursor")?.style.top ?? ""
  );
  if (Number.isFinite(left) && Number.isFinite(top)) {
    lastCursorPos = { x: left, y: top };
  }
  await delay(120);
  return true;
}

export async function simulateDemoPointerClick(
  target: HTMLElement,
  options?: {
    shouldAbort?: () => boolean;
    scroll?: boolean;
    dispatchPointerEvents?: boolean;
  }
): Promise<boolean> {
  const selector = describeCursorTarget(target);
  const rect = target.getBoundingClientRect();
  const bbox = {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    w: Math.round(rect.width),
    h: Math.round(rect.height),
  };
  playbackDiagTarget({
    selector,
    found: true,
    element: target,
    detail: "click target resolve",
  });

  if (options?.shouldAbort?.()) {
    playbackDiagClick({
      ok: false,
      selector,
      bbox,
      detail: "click FAIL — aborted before travel",
    });
    return false;
  }
  if (!isClickableTarget(target)) {
    playbackDiagClick({
      ok: false,
      selector,
      bbox,
      detail: "click FAIL — not clickable",
    });
    return false;
  }

  // Overlay eyes — never click through an open blocking dialog/scrim.
  const guarded = resolveClickTargetRespectingModal(target);
  if (!guarded || isElementBlockedByModal(target)) {
    notePlaybackCursorEvent("abort", {
      target: selector,
      abortReason: "blocked-by-modal",
    });
    playbackDiagClick({
      ok: false,
      selector,
      bbox,
      detail: "click FAIL — blocked-by-modal",
    });
    return false;
  }

  if (options?.scroll !== false) {
    await revealDemoTargetForAgent(target, {
      shouldAbort: options?.shouldAbort,
    });
  }

  const cursor = await moveDemoCursorTo(target, {
    shouldAbort: options?.shouldAbort,
    syncPageScroll: options?.scroll !== false,
  });
  if (!cursor || options?.shouldAbort?.()) {
    playbackDiagClick({
      ok: false,
      selector,
      bbox,
      detail: "click FAIL — cursor travel aborted",
    });
    await releaseDemoCursorAfterScript();
    return false;
  }

  const interactionRoot = findDemoInteractionRoot(target);
  const { x, y } = targetCenter(target);
  const dispatchEvents = options?.dispatchPointerEvents !== false;

  // Hover class + enter/over/move events (CSS bridged via ensureDemoPseudoBridge).
  setDemoInteractionHover(interactionRoot, true, { x, y });
  await delay(CTA_HOVER_DWELL_MS);
  if (options?.shouldAbort?.()) {
    setDemoInteractionHover(interactionRoot, false, { x, y });
    notePlaybackCursorEvent("abort", {
      target: describeCursorTarget(target),
      abortReason: "click-aborted",
    });
    playbackDiagClick({
      ok: false,
      selector,
      bbox,
      detail: "click FAIL — aborted during hover",
    });
    await releaseDemoCursorAfterScript();
    return false;
  }

  const lockedLeft = Number.parseFloat(cursor.style.left);
  const lockedTop = Number.parseFloat(cursor.style.top);
  if (Number.isFinite(lockedLeft) && Number.isFinite(lockedTop)) {
    noteCursorPathSample("press", lockedLeft, lockedTop);
  }
  tapDemoCursor(cursor);
  notePlaybackCursorEvent("press", {
    target: describeCursorTarget(interactionRoot),
    animated: true,
    detail: "64ms",
  });

  // Native parity: :hover stays while :active — keep hover class during press.
  // Do not rewrite cursor left/top (on-target lock).
  interactionRoot.classList.add(DEMO_HOVER_CLASS, DEMO_PRESSED_CLASS);
  interactionRoot.setAttribute(DEMO_ROBO_HOVER_ATTR, "true");
  if (dispatchEvents) {
    dispatchDemoPointerDown(interactionRoot, x, y);
    notifyStudioDemoClick();
  }
  await delay(CTA_PRESS_MS);
  if (options?.shouldAbort?.()) {
    interactionRoot.classList.remove(DEMO_PRESSED_CLASS);
    setDemoInteractionHover(interactionRoot, false, { x, y });
    playbackDiagClick({
      ok: false,
      selector,
      bbox,
      detail: "click FAIL — aborted during press",
    });
    await releaseDemoCursorAfterScript();
    return false;
  }

  if (dispatchEvents) {
    dispatchDemoPointerUp(interactionRoot, x, y);
  }
  interactionRoot.classList.remove(DEMO_PRESSED_CLASS);
  if (Number.isFinite(lockedLeft) && Number.isFinite(lockedTop)) {
    noteCursorPathSample("release", lockedLeft, lockedTop);
  }
  notePlaybackCursorEvent("release", {
    target: describeCursorTarget(interactionRoot),
    animated: true,
  });
  notePlaybackDemoClick(interactionRoot);
  target.click();
  notePlaybackCursorEvent("click", {
    target: describeCursorTarget(interactionRoot),
    animated: true,
    detail: options?.scroll === false ? "scroll-disabled" : "scroll-enabled",
  });
  playbackDiagClick({
    ok: true,
    selector,
    bbox,
    detail: `click ok (${options?.scroll === false ? "scroll-disabled" : "scroll-enabled"})`,
  });
  // Default arrow after click — CSS tip-align keeps left/top (no tip teleport).
  settleDemoCursorAfterClick(cursor, interactionRoot);
  if (Number.isFinite(lockedLeft) && Number.isFinite(lockedTop)) {
    writeDemoCursorPos(cursor, lockedLeft, lockedTop, { force: true });
    cursorPosLocked = true;
    noteCursorPathSample("post-click", lockedLeft, lockedTop);
  }
  await delay(160);
  return true;
}
