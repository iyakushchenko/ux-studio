import defaultCursorUrl from "@/assets/default-cursor.svg";
import handIndexCursorUrl from "@/assets/hand-index-cursor.svg";
import {
  beginDemoTargetPageScroll,
  isPrototypeOverlayTarget,
  isPrototypePageScrollLocked,
  type PlaybackScrollOptions,
} from "@/app/scenario/playbackScroll";
import { notePlaybackDemoClick } from "@/app/shell/playbackInteractionContext";
import {
  describeCursorTarget,
  notePlaybackCursorEvent,
} from "@/app/shell/playbackCursorDiagnostic";

const CURSOR_ARROW_SVG = `<img class="proto-chat-demo-cursor__graphic proto-chat-demo-cursor__graphic--arrow" src="${defaultCursorUrl}" width="22" height="26" alt="" aria-hidden="true" draggable="false" />`;

const CURSOR_HAND_SVG = `<img class="proto-chat-demo-cursor__graphic proto-chat-demo-cursor__graphic--hand" src="${handIndexCursorUrl}" width="24" height="37" alt="" aria-hidden="true" draggable="false" />`;

const DEMO_CURSOR_MARKUP = `${CURSOR_ARROW_SVG}${CURSOR_HAND_SVG}`;

const CTA_TRAVEL_MS = 820;
const CTA_PRESS_MS = 380;
const CTA_HOVER_DWELL_MS = 220;
const CURSOR_EXIT_MS = 1600;
const CURSOR_EXIT_DRIFT_PX = 10;
const CURSOR_FADE_MS = 480;
/** Parked robo-cursor in CJM — inset from the right edge, lower-right resting pose. */
const CURSOR_REST_RIGHT_INSET_RATIO = 0.08;
const CURSOR_REST_Y_RATIO = 0.54;
const CURSOR_PARK_DRIFT_PX = 20;
const CURSOR_PARK_TRAVEL_MS = 520;
/** Hotspot — arrow tip in default-cursor.svg; index fingertip in hand-index-cursor.svg. */
const CURSOR_HOTSPOT_X = 4;
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

/** DOM snapshot for QA / MCP cursor eyes. */
export function readDemoCursorDomState(): {
  visible: boolean;
  parked: boolean;
  faded: boolean;
} {
  const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
  const exiting =
    cursor?.classList.contains("proto-chat-demo-cursor--exit") ?? false;
  return {
    visible: cursor != null && !exiting,
    parked: isDemoCursorParked(),
    faded: journeyEndCursorFaded || exiting,
  };
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
  cursor.style.left = `${position.x}px`;
  cursor.style.top = `${position.y}px`;
  lastCursorPos = { x: position.x, y: position.y };
}

function resolveDemoCursorSeedPosition(): { x: number; y: number } {
  const current = readCursorPosition();
  if (current) return current;
  if (lastCursorPos) return lastCursorPos;
  const rest = resolveDemoCursorRestPosition();
  return { x: rest.left, y: rest.top };
}

/** CJM idle pose — visible on the right, waiting for the next director call. */
export function parkDemoCursorAtRest(options?: {
  animate?: boolean;
}): Promise<void> {
  if (!journeyModePinned) {
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
    onApproach?: () => void;
    approachElement?: HTMLElement;
    /** Re-read end position each frame (page scroll in progress). */
    trackTarget?: HTMLElement;
    shouldAbort?: () => boolean;
  }
): Promise<boolean> {
  const resolveEnd = () => {
    if (options?.trackTarget) {
      const tracked = cursorPositionForTarget(options.trackTarget);
      return { x: tracked.left, y: tracked.top };
    }
    return { x: endX, y: endY };
  };

  const initialEnd = resolveEnd();
  const dx = initialEnd.x - startX;
  const dy = initialEnd.y - startY;
  const dist = Math.hypot(dx, dy) || 1;
  const arcMag = Math.min(56, dist * 0.14) * (Math.random() > 0.5 ? 1 : -1);
  const ctrlX = startX + dx * 0.42 + (-dy / dist) * arcMag;
  const ctrlY = startY + dy * 0.42 + (dx / dist) * arcMag;

  cursor.style.transition = "none";
  const start = performance.now();
  let approached = false;

  const tryApproach = (left: number, top: number) => {
    if (approached || !options?.onApproach) return;
    if (options.approachElement) {
      const { x: hotspotX, y: hotspotY } = cursorHotspotFromPos(left, top);
      if (!hotspotIntersectsElement(hotspotX, hotspotY, options.approachElement)) {
        return;
      }
    }
    approached = true;
    options.onApproach();
  };

  tryApproach(startX, startY);

  let completed = false;
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      if (options?.shouldAbort?.()) {
        resolve();
        return;
      }
      const t = Math.min(1, (now - start) / durationMs);
      const e = easeOutCubic(t);
      const end = resolveEnd();
      const u = 1 - e;
      let x = u * u * startX + 2 * u * e * ctrlX + e * e * end.x;
      let y = u * u * startY + 2 * u * e * ctrlY + e * e * end.y;
      if (!options?.trackTarget && t > 0.9) {
        x += randomInRange(-1.2, 1.2);
        y += randomInRange(-0.8, 0.8);
      }
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      tryApproach(x, y);
      if (t < 1) requestAnimationFrame(tick);
      else {
        completed = true;
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });

  if (!completed || options?.shouldAbort?.()) {
    return false;
  }

  const finalEnd = resolveEnd();
  cursor.style.left = `${finalEnd.x}px`;
  cursor.style.top = `${finalEnd.y}px`;
  lastCursorPos = { x: finalEnd.x, y: finalEnd.y };
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
  document
    .querySelectorAll<HTMLElement>(".proto-chat-cta--hover, .proto-chat-cta--pressed")
    .forEach((el) => {
      el.classList.remove("proto-chat-cta--hover", "proto-chat-cta--pressed");
    });
  document
    .querySelectorAll<HTMLElement>(".proto-demo-avatar-hover")
    .forEach((el) => el.classList.remove("proto-demo-avatar-hover"));
  activeHoverRoot = null;
}

function setDemoCursorPointerMode(active: boolean): void {
  document.querySelectorAll<HTMLElement>(".proto-chat-demo-cursor").forEach((cursor) => {
    cursor.classList.toggle("proto-chat-demo-cursor--pointer", active);
  });
}

function setDemoInteractionHover(root: HTMLElement | null, active: boolean): void {
  if (activeHoverRoot && activeHoverRoot !== root) {
    activeHoverRoot.classList.remove("proto-chat-cta--hover", "proto-chat-cta--pressed");
  }
  activeHoverRoot = active ? root : null;
  setDemoCursorPointerMode(active);
  if (!root) return;
  if (active) {
    root.classList.add("proto-chat-cta--hover");
  } else {
    root.classList.remove("proto-chat-cta--hover", "proto-chat-cta--pressed");
  }
}

function clearDemoCursorImmediate(): void {
  cancelDemoCursorJourneyEndFade();
  cancelDemoCursorParkInFlight();
  cursorFadeGeneration += 1;
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
    clearDemoCursorImmediate();
    return;
  }
  if (options?.fade) {
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

/** After a scripted click — keep cursor on target; clear press/tap visuals only. */
export function settleDemoCursorAfterClick(
  cursor: HTMLElement,
  interactionRoot?: HTMLElement | null
): void {
  cursor.classList.remove("proto-chat-demo-cursor--tap");
  cursor.classList.remove(DEMO_CURSOR_PARKED_CLASS);
  if (interactionRoot) {
    interactionRoot.classList.remove("proto-chat-cta--pressed");
    setDemoInteractionHover(interactionRoot, true);
  } else {
    setDemoCursorPointerMode(true);
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

function dispatchDemoPointerEvent(
  target: HTMLElement,
  type: "pointerenter" | "pointerdown" | "pointerup",
  x: number,
  y: number
): void {
  const init: PointerEventInit = {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
  };
  target.dispatchEvent(new PointerEvent(type, init));

  const mouseType =
    type === "pointerenter"
      ? "mouseenter"
      : type === "pointerdown"
        ? "mousedown"
        : "mouseup";
  target.dispatchEvent(
    new MouseEvent(mouseType, {
      bubbles: mouseType !== "mouseenter",
      cancelable: true,
      clientX: x,
      clientY: y,
    })
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
  if (Number(style.opacity) === 0) return false;
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
  const bail = async (): Promise<null> => {
    notePlaybackCursorEvent("abort", {
      target: describeCursorTarget(target),
      abortReason: options?.shouldAbort?.() ? "shouldAbort" : "travel-incomplete",
    });
    await releaseDemoCursorAfterScript();
    return null;
  };

  if (options?.shouldAbort?.()) return bail();

  cancelDemoCursorParkInFlight();

  const interactionRoot = findDemoInteractionRoot(target);
  const applyHover = options?.applyHover !== false;
  const syncPageScroll =
    options?.syncPageScroll !== false &&
    !isPrototypePageScrollLocked() &&
    !isPrototypeOverlayTarget(target);

  const scrollOpts: PlaybackScrollOptions = {
    shouldAbort: options?.shouldAbort,
  };
  const { durationMs: scrollDurationMs, scrollPromise } = syncPageScroll
    ? await beginDemoTargetPageScroll(target, scrollOpts)
    : { durationMs: 0, scrollPromise: Promise.resolve() };

  if (scrollDurationMs > 0) {
    notePlaybackCursorEvent("scroll-into-view", {
      target: describeCursorTarget(target),
      animated: true,
      scroll: true,
      detail: `sync-page-scroll ${scrollDurationMs}ms`,
    });
  }

  if (options?.shouldAbort?.()) return bail();

  const cursor = acquireDemoCursorElement();

  const end = cursorPositionForTarget(target);
  const endX = end.left;
  const endY = end.top;
  const travelStart = journeyModePinned
    ? prepareDemoCursorForTravel(cursor)
    : resolveCursorStart(endX, endY);

  cursor.style.left = `${travelStart.x}px`;
  cursor.style.top = `${travelStart.y}px`;

  await delay(randomInRange(24, 72));
  if (options?.shouldAbort?.()) return bail();

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
      approachElement: applyHover ? interactionRoot : undefined,
      trackTarget: syncPageScroll && scrollDurationMs > 0 ? target : undefined,
      onApproach: applyHover
        ? () => {
            setDemoInteractionHover(interactionRoot, true);
          }
        : undefined,
      shouldAbort: options?.shouldAbort,
    }
  );
  await scrollPromise;
  if (!traveled || options?.shouldAbort?.()) return bail();

  notePlaybackCursorEvent("travel", {
    target: describeCursorTarget(target),
    animated: true,
    detail: applyHover ? "with-hover" : "no-hover",
  });

  if (applyHover) {
    setDemoInteractionHover(interactionRoot, true);
  }
  await delay(randomInRange(20, 60));
  if (options?.shouldAbort?.()) return bail();
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
  if (options?.shouldAbort?.()) return false;
  if (!isClickableTarget(target)) return false;

  const cursor = await moveDemoCursorTo(target, {
    shouldAbort: options?.shouldAbort,
    syncPageScroll: options?.scroll !== false,
  });
  if (!cursor || options?.shouldAbort?.()) {
    await releaseDemoCursorAfterScript();
    return false;
  }

  const interactionRoot = findDemoInteractionRoot(target);
  const { x, y } = targetCenter(target);
  const dispatchEvents = options?.dispatchPointerEvents !== false;

  setDemoInteractionHover(interactionRoot, true);
  if (dispatchEvents) {
    dispatchDemoPointerEvent(interactionRoot, "pointerenter", x, y);
  }
  await delay(CTA_HOVER_DWELL_MS);
  if (options?.shouldAbort?.()) {
    setDemoInteractionHover(interactionRoot, false);
    notePlaybackCursorEvent("abort", {
      target: describeCursorTarget(target),
      abortReason: "click-aborted",
    });
    await releaseDemoCursorAfterScript();
    return false;
  }

  tapDemoCursor(cursor);
  notePlaybackCursorEvent("press", {
    target: describeCursorTarget(interactionRoot),
    animated: true,
  });

  interactionRoot.classList.remove("proto-chat-cta--hover");
  interactionRoot.classList.add("proto-chat-cta--pressed");
  if (dispatchEvents) {
    dispatchDemoPointerEvent(interactionRoot, "pointerdown", x, y);
    notifyStudioDemoClick();
  }
  await delay(CTA_PRESS_MS);
  if (options?.shouldAbort?.()) {
    setDemoInteractionHover(interactionRoot, false);
    await releaseDemoCursorAfterScript();
    return false;
  }

  if (dispatchEvents) {
    dispatchDemoPointerEvent(interactionRoot, "pointerup", x, y);
  }
  notePlaybackDemoClick(interactionRoot);
  target.click();
  notePlaybackCursorEvent("click", {
    target: describeCursorTarget(interactionRoot),
    animated: true,
    detail: options?.scroll === false ? "scroll-disabled" : "scroll-enabled",
  });
  settleDemoCursorAfterClick(cursor, interactionRoot);
  await delay(160);
  return true;
}
