import {
  cancelDemoCursorTravel,
  delay,
  parkDemoCursorAtRest,
  settleDemoCursorAfterInteraction,
  simulateDemoPointerClick,
} from "@/app/scenario/demoCursor";
import { playbackReadinessDelay } from "@/app/scenario/playbackReadiness";
import { delayPacing } from "@/app/shell/playbackTiming";
import type { HomeScriptId } from "@/app/orchestra/types";
import {
  playbackDiagTypeInEnd,
  playbackDiagTypeInProgress,
  playbackDiagTypeInStart,
} from "@/app/shell/playbackDiag";
import {
  beginTypeInCursorGuard,
  endTypeInCursorGuard,
  tickTypeInCursorGuard,
} from "@/app/shell/typeInCursorGuard";
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
let homeScriptInFlight = false;

export function abortSitePilotHomePlayback(): void {
  playbackAborted = true;
  if (homeScriptInFlight) {
    // `abortAll()` also runs during the normal Home → Chat handoff. Removing
    // the element here made the robo-cursor disappear for one paint between
    // screens. Stop any obsolete travel, but keep a visible settled cursor.
    cancelDemoCursorTravel();
    void parkDemoCursorAtRest({
      animate: true,
      reason: "site-pilot-home-handoff",
    });
  }
  homeScriptInFlight = false;
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
 * Prefer live React Site Pilot card. Legacy body stays in DOM under
 * `data-studio-legacy-retired` (display:none) and would otherwise win
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
    ).find((el) => !el.closest("[data-studio-legacy-retired]")) ?? null
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
    if (ta && !ta.closest("[data-studio-legacy-retired]")) return ta;
    await playbackReadinessDelay(40);
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

  // Always clear + type-in during CJM (never skip for prefilled HOME_QUERY_DEFAULT).
  // Prefill skip hid the animation after React Site Pilot mount — PLAYBACK_DIAG.
  // CJM on = robo-cursor must stay visible for the whole typed-text beat.
  playbackDiagTypeInStart("site-pilot", text.length, "sarah-query-submit");
  setReactTextareaValue(ta, "");
  syncHomeQueryHeight(ta);
  ta.focus();
  beginTypeInCursorGuard(ta);
  playbackDiagTypeInProgress(0);

  for (let i = 0; i < text.length; i++) {
    if (shouldAbort()) {
      setReactTextareaValue(ta, "");
      syncHomeQueryHeight(ta);
      playbackDiagTypeInEnd(false, "aborted");
      endTypeInCursorGuard();
      return false;
    }
    setReactTextareaValue(ta, text.slice(0, i + 1));
    syncHomeQueryHeight(ta);
    tickTypeInCursorGuard(ta, i + 1);
    playbackDiagTypeInProgress(i + 1);
    await delayPacing(TYPING_MS_PER_CHAR + Math.random() * TYPING_MS_JITTER);
  }

  if (shouldAbort()) {
    setReactTextareaValue(ta, "");
    syncHomeQueryHeight(ta);
    playbackDiagTypeInEnd(false, "aborted");
    endTypeInCursorGuard();
    return false;
  }

  const sendBtn = getHomeSendButton();
  if (!sendBtn) {
    playbackDiagTypeInEnd(false, "send button missing");
    endTypeInCursorGuard();
    return false;
  }

  const clicked = await simulateDemoPointerClick(sendBtn, { shouldAbort });
  if (clicked) {
    // Home composer submit — never leave cursor on send.
    await settleDemoCursorAfterInteraction(sendBtn);
  }
  playbackDiagTypeInEnd(clicked, clicked ? "typed + send" : "send click failed");
  endTypeInCursorGuard();
  return clicked;
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
  homeScriptInFlight = true;
  try {
    // Retreat-sync: restore composer to demo query (no type-in / no send).
    // Bare `return scriptOk()` left home dirty and leaked homeScriptInFlight —
    // next SF re-ran into a no-op Alarm (transport-step-no-op).
    if (options?.syncState) {
      return await runSarahQuerySubmit({ skip: true });
    }

    switch (scriptId) {
      case "sarah-query-submit":
        return await runSarahQuerySubmit(options);
      default:
        return scriptFail(`unknown home script: ${String(scriptId)}`);
    }
  } finally {
    homeScriptInFlight = false;
  }
}
