const CURSOR_SVG = `<svg class="block size-full" fill="none" viewBox="0 0 22 26" aria-hidden="true"><path fill="#fff" stroke="#4F4F4F" stroke-width="0.6" d="M3.5 2.5 18.5 12 10.5 14.5 12.5 22.5 9.5 23.5 7.5 15.5 3.5 17.5z"/></svg>`;

const CTA_TRAVEL_MS = 820;
const CTA_PRESS_MS = 380;
const CURSOR_HOTSPOT_X = 6;
const CURSOR_HOTSPOT_Y = 4;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function removeDemoCursor(): void {
  document
    .querySelectorAll<HTMLElement>(".proto-chat-demo-cursor")
    .forEach((el) => el.remove());
}

export function clearSimulatedClickRipples(): void {
  document
    .querySelectorAll<HTMLElement>(".proto-sim-click")
    .forEach((el) => el.remove());
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

export async function moveDemoCursorTo(target: HTMLElement): Promise<HTMLElement> {
  removeDemoCursor();
  const cursor = document.createElement("div");
  cursor.className = "proto-chat-demo-cursor";
  cursor.innerHTML = CURSOR_SVG;
  document.body.appendChild(cursor);

  const end = cursorPositionForTarget(target);
  const endX = end.left;
  const endY = end.top;
  const startX = endX + 168;
  const startY = endY + 124;

  cursor.style.setProperty("--proto-cursor-travel-ms", `${CTA_TRAVEL_MS}ms`);
  cursor.style.left = `${startX}px`;
  cursor.style.top = `${startY}px`;

  await delay(40);
  cursor.style.left = `${endX}px`;
  cursor.style.top = `${endY}px`;
  await delay(CTA_TRAVEL_MS);
  return cursor;
}

export async function simulateDemoPointerClick(
  target: HTMLElement,
  options?: { shouldAbort?: () => boolean; scroll?: boolean }
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

  const { x, y } = targetCenter(target);
  spawnSimulatedClickRipple(x, y);
  tapDemoCursor(cursor);
  await delay(CTA_PRESS_MS);
  target.click();
  removeDemoCursor();
  await delay(160);
  return true;
}
