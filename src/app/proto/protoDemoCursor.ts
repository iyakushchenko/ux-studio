const CURSOR_ARROW_SVG = `<svg class="proto-chat-demo-cursor__graphic proto-chat-demo-cursor__graphic--arrow" fill="none" viewBox="0 0 22 26" aria-hidden="true"><path fill="#fff" stroke="#4F4F4F" stroke-width="0.6" d="M3.5 2.5 18.5 12 10.5 14.5 12.5 22.5 9.5 23.5 7.5 15.5 3.5 17.5z"/></svg>`;

const CURSOR_HAND_SVG = `<svg class="proto-chat-demo-cursor__graphic proto-chat-demo-cursor__graphic--hand" fill="none" viewBox="0 0 24 28" aria-hidden="true"><path fill="#fff" stroke="#4F4F4F" stroke-width="0.7" stroke-linejoin="round" stroke-linecap="round" d="M6.2 1.1c1.2-.2 2.4.6 2.6 1.9l.3 7.5c.1.7.6 1.2 1.3 1.4l2.4.5c1.4.3 2.4 1.1 3 2.3.4 1 .6 2 .9 3 .3 1 .9 1.6 1.8 1.9 1 .3 1.6 1.1 1.4 2.1-.2 1.2-1.3 1.9-2.5 1.7l-2.3-.4c-.7-.1-1.3.4-1.4 1.1l-.3 1.3c-.2 1-.9 1.6-1.9 1.4l-3.6-.6c-1.4-.3-2.4-1.4-2.2-2.8l.4-2.4c.2-1-.5-1.9-1.5-2.3l-1.7-.6c-.9-.3-1.4-1.2-1-2.1l1-2.6c.4-.9 1.3-1.4 2.3-1.2l1.2.3c-.5-1.2-.5-2.5-.3-3.7l.6-2.6c.2-1 .5-1.3.8-1.3z"/></svg>`;

const DEMO_CURSOR_MARKUP = `${CURSOR_ARROW_SVG}${CURSOR_HAND_SVG}`;

const CTA_TRAVEL_MS = 820;
const CTA_PRESS_MS = 380;
const CTA_HOVER_DWELL_MS = 360;
const CURSOR_EXIT_MS = 1600;
const CURSOR_EXIT_DRIFT_PX = 10;
const CURSOR_HOTSPOT_X = 9;
const CURSOR_HOTSPOT_Y = 3;

export const PROTO_DEMO_CLICK_EVENT = "proto-demo-click";

export function notifyStudioDemoClick(): void {
  document.dispatchEvent(new CustomEvent(PROTO_DEMO_CLICK_EVENT));
}

let lastCursorPos: { x: number; y: number } | null = null;
let activeHoverRoot: HTMLElement | null = null;

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function resetDemoCursorTravelOrigin(): void {
  lastCursorPos = null;
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
  }
): Promise<void> {
  const dx = endX - startX;
  const dy = endY - startY;
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

  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const e = easeOutCubic(t);
      const u = 1 - e;
      let x = u * u * startX + 2 * u * e * ctrlX + e * e * endX;
      let y = u * u * startY + 2 * u * e * ctrlY + e * e * endY;
      if (t > 0.9) {
        x += randomInRange(-1.2, 1.2);
        y += randomInRange(-0.8, 0.8);
      }
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      tryApproach(x, y);
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });

  cursor.style.left = `${endX}px`;
  cursor.style.top = `${endY}px`;
  lastCursorPos = { x: endX, y: endY };
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

function resolveCursorStart(endX: number, endY: number): { x: number; y: number } {
  if (lastCursorPos) {
    const jitter = randomInRange(6, 18);
    const angle = randomInRange(0, Math.PI * 2);
    return {
      x: lastCursorPos.x + Math.cos(angle) * jitter,
      y: lastCursorPos.y + Math.sin(angle) * jitter,
    };
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
  ".proto-tertiary-cta",
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

export function removeDemoCursor(): void {
  document
    .querySelectorAll<HTMLElement>(".proto-chat-demo-cursor")
    .forEach((el) => el.remove());
  clearDemoCtaStates();
}

/** Scripted playback end — drift cursor off-screen and fade out. */
export async function exitDemoCursor(): Promise<void> {
  clearDemoCtaStates();

  let cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
  let startX = lastCursorPos?.x ?? window.innerWidth * 0.58;
  let startY = lastCursorPos?.y ?? window.innerHeight * 0.42;

  if (cursor) {
    const left = Number.parseFloat(cursor.style.left);
    const top = Number.parseFloat(cursor.style.top);
    if (Number.isFinite(left)) startX = left;
    if (Number.isFinite(top)) startY = top;
  } else {
    cursor = document.createElement("div");
    cursor.className = "proto-chat-demo-cursor proto-chat-demo-cursor--exit";
    cursor.innerHTML = DEMO_CURSOR_MARKUP;
    cursor.style.left = `${startX}px`;
    cursor.style.top = `${startY}px`;
    document.body.appendChild(cursor);
    await delay(40);
  }

  cursor.classList.add("proto-chat-demo-cursor--exit");
  await animateCursorExit(cursor, startX, startY);
  cursor.remove();
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

function spawnSimulatedClickRipple(x: number, y: number): void {
  const hit = document.createElement("div");
  hit.className = "proto-sim-click";
  hit.style.left = `${x}px`;
  hit.style.top = `${y}px`;
  hit.innerHTML = [
    '<span class="proto-sim-click__ring proto-sim-click__ring--1" aria-hidden="true"></span>',
    '<span class="proto-sim-click__ring proto-sim-click__ring--2" aria-hidden="true"></span>',
    '<span class="proto-sim-click__ring proto-sim-click__ring--3" aria-hidden="true"></span>',
  ].join("");
  document.body.appendChild(hit);

  const remove = () => hit.remove();
  hit.addEventListener("animationend", (event) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.classList.contains("proto-sim-click__ring--3")
    ) {
      remove();
    }
  });
  window.setTimeout(remove, 1600);
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
  options?: { applyHover?: boolean }
): Promise<HTMLElement> {
  document
    .querySelectorAll<HTMLElement>(".proto-chat-demo-cursor")
    .forEach((el) => el.remove());

  const interactionRoot = findDemoInteractionRoot(target);
  const applyHover = options?.applyHover !== false;

  const cursor = document.createElement("div");
  cursor.className = "proto-chat-demo-cursor";
  cursor.innerHTML = DEMO_CURSOR_MARKUP;
  document.body.appendChild(cursor);

  const end = cursorPositionForTarget(target);
  const endX = end.left;
  const endY = end.top;
  const start = resolveCursorStart(endX, endY);

  cursor.style.left = `${start.x}px`;
  cursor.style.top = `${start.y}px`;

  await delay(randomInRange(24, 72));

  const durationMs = CTA_TRAVEL_MS * randomInRange(0.88, 1.14);
  await animateCursorTravel(cursor, start.x, start.y, endX, endY, durationMs, {
    approachElement: applyHover ? interactionRoot : undefined,
    onApproach: applyHover
      ? () => {
          setDemoInteractionHover(interactionRoot, true);
        }
      : undefined,
  });
  if (applyHover) {
    setDemoInteractionHover(interactionRoot, true);
  }
  await delay(randomInRange(40, 110));
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

  if (options?.scroll !== false) {
    target.scrollIntoView({ block: "nearest", behavior: "smooth" });
    await delay(180);
  }
  if (options?.shouldAbort?.()) return false;
  if (!isClickableTarget(target)) return false;

  const interactionRoot = findDemoInteractionRoot(target);
  await moveDemoCursorTo(target);
  if (options?.shouldAbort?.()) {
    removeDemoCursor();
    return false;
  }

  options?.onHoverStart?.(interactionRoot);
  await delay(dwellMs);
  if (options?.shouldAbort?.()) {
    options?.onHoverEnd?.();
    removeDemoCursor();
    return false;
  }

  options?.onHoverEnd?.();
  setDemoInteractionHover(interactionRoot, false);
  document
    .querySelectorAll<HTMLElement>(".proto-chat-demo-cursor")
    .forEach((el) => el.remove());
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

  if (options?.scroll !== false) {
    target.scrollIntoView({ block: "nearest", behavior: "smooth" });
    await delay(180);
  }
  if (options?.shouldAbort?.()) return false;
  if (!isClickableTarget(target)) return false;

  const cursor = await moveDemoCursorTo(target);
  if (options?.shouldAbort?.()) {
    removeDemoCursor();
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
    removeDemoCursor();
    return false;
  }

  spawnSimulatedClickRipple(x, y);
  tapDemoCursor(cursor);

  interactionRoot.classList.remove("proto-chat-cta--hover");
  interactionRoot.classList.add("proto-chat-cta--pressed");
  if (dispatchEvents) {
    dispatchDemoPointerEvent(interactionRoot, "pointerdown", x, y);
    notifyStudioDemoClick();
  }
  await delay(CTA_PRESS_MS);
  if (options?.shouldAbort?.()) {
    setDemoInteractionHover(interactionRoot, false);
    removeDemoCursor();
    return false;
  }

  if (dispatchEvents) {
    dispatchDemoPointerEvent(interactionRoot, "pointerup", x, y);
  }
  target.click();
  setDemoInteractionHover(interactionRoot, false);
  removeDemoCursor();
  await delay(160);
  return true;
}
