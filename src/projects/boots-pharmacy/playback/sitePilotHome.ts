import {
  delay,
  removeDemoCursor,
  simulateDemoPointerClick,
} from "@/app/proto/protoDemoCursor";
import type { HomeScriptId } from "@/app/orchestra/types";

const AGENTIC_QUERY_LINE_PX = 24;
const AGENTIC_QUERY_MAX_LINES = 5;

const TYPING_MS_PER_CHAR = 26;
const TYPING_MS_JITTER = 14;
const HOME_DOM_SETTLE_MS = 320;

/** Default Agentic home query — Sarah's travel vaccination intent. */
export const AGENTIC_HOME_DEMO_QUERY =
  "I need a full course of travel vaccinations for a three-week trip to Southeast Asia (Indonesia) starting next month, specifically looking to book and buy jabs as a bundle if possible.";

let playbackAborted = false;

export function abortSitePilotHomePlayback(): void {
  playbackAborted = true;
  removeDemoCursor();
}

export function wasSitePilotHomePlaybackAborted(): boolean {
  return playbackAborted;
}

function shouldAbort(): boolean {
  return playbackAborted;
}

function syncHomeQueryHeight(ta: HTMLTextAreaElement): void {
  const max = AGENTIC_QUERY_LINE_PX * AGENTIC_QUERY_MAX_LINES;
  ta.style.setProperty("height", "0px", "important");
  ta.style.setProperty("min-height", "0px", "important");
  const next = Math.min(
    Math.max(ta.scrollHeight, AGENTIC_QUERY_LINE_PX),
    max
  );
  ta.style.setProperty("min-height", `${AGENTIC_QUERY_LINE_PX}px`, "important");
  ta.style.setProperty("height", `${next}px`, "important");
  ta.style.setProperty(
    "overflow-y",
    next >= max ? "auto" : "hidden",
    "important"
  );
}

function getAgenticHomeCard(): HTMLElement | null {
  const screen = document.querySelector<HTMLElement>(
    ".proto-viewport > div > div:nth-child(11)"
  );
  return (
    screen?.querySelector<HTMLElement>(
      '[data-name="component.co.order.summary"]'
    ) ?? null
  );
}

async function waitForHomeTextarea(): Promise<HTMLTextAreaElement | null> {
  for (let i = 0; i < 60; i++) {
    const ta = getAgenticHomeCard()?.querySelector<HTMLTextAreaElement>(
      "textarea.proto-agentic-query"
    );
    if (ta) return ta;
    await delay(40);
  }
  return null;
}

function getHomeSendButton(): HTMLElement | null {
  const subtotal = getAgenticHomeCard()?.querySelector<HTMLElement>(
    '[data-name="Subtotal"]'
  );
  if (!subtotal) return null;

  return (
    Array.from(
      subtotal.querySelectorAll<HTMLElement>(
        '[data-name="component.input.button"]'
      )
    ).find((btn) =>
      btn.querySelector('[data-name="icon / input / arrows"]')
    ) ?? null
  );
}

async function simulateSarahHomeTyping(text: string): Promise<void> {
  const ta = await waitForHomeTextarea();
  if (!ta || shouldAbort()) return;

  await delay(HOME_DOM_SETTLE_MS);
  if (shouldAbort()) return;

  ta.value = "";
  syncHomeQueryHeight(ta);
  ta.focus();

  for (let i = 0; i < text.length; i++) {
    if (shouldAbort()) {
      ta.value = "";
      syncHomeQueryHeight(ta);
      return;
    }
    ta.value = text.slice(0, i + 1);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    syncHomeQueryHeight(ta);
    await delay(TYPING_MS_PER_CHAR + Math.random() * TYPING_MS_JITTER);
  }

  if (shouldAbort()) {
    ta.value = "";
    syncHomeQueryHeight(ta);
    return;
  }

  const sendBtn = getHomeSendButton();
  if (!sendBtn) return;

  await simulateDemoPointerClick(sendBtn, { shouldAbort });
}

async function runSarahQuerySubmit(options?: { skip?: boolean }): Promise<void> {
  if (options?.skip) {
    const ta = await waitForHomeTextarea();
    if (!ta || shouldAbort()) return;
    ta.value = AGENTIC_HOME_DEMO_QUERY;
    syncHomeQueryHeight(ta);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    // Journey beat advance switches to chat — don't click send (it navigates early).
    return;
  }
  await simulateSarahHomeTyping(AGENTIC_HOME_DEMO_QUERY);
}

export async function runSitePilotHomeScript(
  scriptId: HomeScriptId,
  options?: { skip?: boolean }
): Promise<void> {
  playbackAborted = false;

  switch (scriptId) {
    case "sarah-query-submit":
      await runSarahQuerySubmit(options);
      break;
    default:
      break;
  }
}
