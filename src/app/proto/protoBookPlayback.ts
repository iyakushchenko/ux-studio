import {
  clearSimulatedClickRipples,
  delay,
  removeDemoCursor,
  simulateDemoPointerClick,
} from "@/app/proto/protoDemoCursor";
import type { BookScriptId } from "@/app/orchestra/types";

let playbackAborted = false;

export function abortBookPlayback(): void {
  playbackAborted = true;
  removeDemoCursor();
  clearSimulatedClickRipples();
}

export function wasBookPlaybackAborted(): boolean {
  return playbackAborted;
}

function shouldAbort(): boolean {
  return playbackAborted;
}

function bookStep2Screen(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    ".proto-viewport > div > div:nth-child(4)"
  );
}

function prototypeScrollRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    ".proto-scroll--prototype:not(.hidden)"
  );
}

async function waitForBookStep2Screen(): Promise<HTMLElement | null> {
  for (let i = 0; i < 60; i++) {
    const screen = bookStep2Screen();
    if (screen) return screen;
    await delay(40);
  }
  return null;
}

async function waitForReserveButton(
  screen: HTMLElement
): Promise<HTMLElement | null> {
  for (let i = 0; i < 60; i++) {
    const btn = Array.from(
      screen.querySelectorAll<HTMLElement>(
        '[data-name="component.input.button"]'
      )
    ).find((el) =>
      /^reserve appointment$/i.test(
        (el.textContent ?? "").replace(/\s+/g, " ").trim()
      )
    );
    if (btn) return btn;
    await delay(40);
  }
  return null;
}

async function scrollToElement(target: HTMLElement): Promise<void> {
  const scrollRoot = prototypeScrollRoot();
  target.scrollIntoView({ block: "center", behavior: "smooth" });
  await delay(280);

  if (!scrollRoot) return;

  const btnRect = target.getBoundingClientRect();
  const rootRect = scrollRoot.getBoundingClientRect();
  const padding = 72;

  if (btnRect.bottom > rootRect.bottom - padding) {
    scrollRoot.scrollTo({
      top:
        scrollRoot.scrollTop +
        (btnRect.bottom - rootRect.bottom) +
        padding,
      behavior: "smooth",
    });
    await delay(420);
    return;
  }

  if (btnRect.top < rootRect.top + padding) {
    scrollRoot.scrollTo({
      top:
        scrollRoot.scrollTop - (rootRect.top + padding - btnRect.top),
      behavior: "smooth",
    });
    await delay(420);
  }
}

async function runReserveAppointment(options?: { skip?: boolean }): Promise<boolean> {
  const screen = await waitForBookStep2Screen();
  if (!screen || shouldAbort()) return false;

  if (!options?.skip) await delay(320);

  const reserveBtn = await waitForReserveButton(screen);
  if (!reserveBtn || shouldAbort()) return false;

  if (options?.skip) {
    reserveBtn.click();
    return true;
  }

  await scrollToElement(reserveBtn);
  if (shouldAbort()) return false;

  await simulateDemoPointerClick(reserveBtn, { shouldAbort });
  await delay(360);
  return !shouldAbort();
}

export async function runBookScript(
  scriptId: BookScriptId,
  options?: { skip?: boolean }
): Promise<boolean> {
  playbackAborted = false;

  switch (scriptId) {
    case "reserve-appointment":
      return runReserveAppointment(options);
    default:
      return false;
  }
}
