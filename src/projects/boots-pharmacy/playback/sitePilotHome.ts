import {
  delay,
  removeDemoCursor,
  simulateDemoPointerClick,
} from "@/app/scenario/demoCursor";
import type { HomeScriptId } from "@/app/orchestra/types";
import type { PlaybackScriptOptions } from "@/projects/playbackScriptOptions";
import {
  scriptAborted,
  scriptFail,
  scriptOk,
  type PlaybackScriptResult,
} from "@/projects/playbackScriptResult";

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
  removeDemoCursor({ immediate: true });
}

export function wasSitePilotHomePlaybackAborted(): boolean {
  return playbackAborted;
}

function shouldAbort(): boolean {
  return playbackAborted;
}

function syncHomeQueryHeight(ta: HTMLTextAreaElement): void {
  // React SitePilotComposer owns Motion height via controlled query + input.
  if (ta.classList.contains("site-pilot-composer__query")) return;
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

/**
 * Prefer live React Site Pilot card. Make body stays in DOM under
 * `data-studio-make-retired` (display:none) and would otherwise win
 * first-match `querySelector` — LESSONS hybrid first-match trap.
 */
function getAgenticHomeCard(): HTMLElement | null {
  const screen = document.querySelector<HTMLElement>(
    ".studio-viewport > div > div:nth-child(11)"
  );
  if (!screen) return null;

  const reactCard =
    screen.querySelector<HTMLElement>(
      '.studio-react-screen-host .home__card[data-name="component.co.order.summary"], [data-studio-react-screen="site-pilot"] .home__card[data-name="component.co.order.summary"]'
    ) ??
    screen.querySelector<HTMLElement>(
      '.studio-react-screen-host [data-name="component.co.order.summary"]'
    );
  if (reactCard) return reactCard;

  return (
    Array.from(
      screen.querySelectorAll<HTMLElement>(
        '[data-name="component.co.order.summary"]'
      )
    ).find((el) => !el.closest("[data-studio-make-retired]")) ?? null
  );
}

/** Native setter so React controlled textareas receive playback typing. */
function setReactTextareaValue(ta: HTMLTextAreaElement, value: string): void {
  const proto = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value"
  )?.set;
  if (proto) proto.call(ta, value);
  else ta.value = value;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

async function waitForHomeTextarea(): Promise<HTMLTextAreaElement | null> {
  for (let i = 0; i < 60; i++) {
    const ta = getAgenticHomeCard()?.querySelector<HTMLTextAreaElement>(
      "textarea.proto-agentic-query, textarea.site-pilot-composer__query"
    );
    if (ta && !ta.closest("[data-studio-make-retired]")) return ta;
    await delay(40);
  }
  return null;
}

function getHomeSendButton(): HTMLElement | null {
  const card = getAgenticHomeCard();
  if (!card) return null;

  const subtotal = card.querySelector<HTMLElement>('[data-name="Subtotal"]');
  const scope = subtotal ?? card;

  return (
    scope.querySelector<HTMLElement>(
      ".proto-agentic-send, .site-pilot-composer__send"
    ) ??
    Array.from(
      scope.querySelectorAll<HTMLElement>(
        '[data-name="component.input.button"]'
      )
    ).find((btn) =>
      btn.querySelector('[data-name="icon / input / arrows"], [data-name="glyph"]')
    ) ??
    null
  );
}

async function simulateSarahHomeTyping(text: string): Promise<boolean> {
  const ta = await waitForHomeTextarea();
  if (!ta || shouldAbort()) return false;

  await delay(HOME_DOM_SETTLE_MS);
  if (shouldAbort()) return false;

  // Default React home query already matches demo intent — click send only.
  if (ta.value.trim() === text.trim()) {
    const sendBtn = getHomeSendButton();
    if (!sendBtn) return false;
    return simulateDemoPointerClick(sendBtn, { shouldAbort });
  }

  setReactTextareaValue(ta, "");
  syncHomeQueryHeight(ta);
  ta.focus();

  for (let i = 0; i < text.length; i++) {
    if (shouldAbort()) {
      setReactTextareaValue(ta, "");
      syncHomeQueryHeight(ta);
      return false;
    }
    setReactTextareaValue(ta, text.slice(0, i + 1));
    syncHomeQueryHeight(ta);
    await delay(TYPING_MS_PER_CHAR + Math.random() * TYPING_MS_JITTER);
  }

  if (shouldAbort()) {
    setReactTextareaValue(ta, "");
    syncHomeQueryHeight(ta);
    return false;
  }

  const sendBtn = getHomeSendButton();
  if (!sendBtn) return false;

  return simulateDemoPointerClick(sendBtn, { shouldAbort });
}

async function runSarahQuerySubmit(
  options?: { skip?: boolean }
): Promise<PlaybackScriptResult> {
  if (options?.skip) {
    const ta = await waitForHomeTextarea();
    if (!ta) {
      return shouldAbort()
        ? scriptAborted()
        : scriptFail("waitForHomeTextarea: textarea.proto-agentic-query missing");
    }
    setReactTextareaValue(ta, AGENTIC_HOME_DEMO_QUERY);
    syncHomeQueryHeight(ta);
    return scriptOk();
  }

  const ta = await waitForHomeTextarea();
  if (!ta) {
    return shouldAbort()
      ? scriptAborted()
      : scriptFail("waitForHomeTextarea: textarea.proto-agentic-query missing");
  }

  const typed = await simulateSarahHomeTyping(AGENTIC_HOME_DEMO_QUERY);
  if (!typed) {
    return shouldAbort()
      ? scriptAborted()
      : scriptFail("simulateSarahHomeTyping: send button missing or click failed");
  }
  return scriptOk();
}

export async function runSitePilotHomeScript(
  scriptId: HomeScriptId,
  options?: PlaybackScriptOptions
): Promise<PlaybackScriptResult> {
  playbackAborted = false;
  if (options?.syncState) return scriptOk();

  switch (scriptId) {
    case "sarah-query-submit":
      return runSarahQuerySubmit(options);
    default:
      return scriptFail(`unknown home script: ${String(scriptId)}`);
  }
}
