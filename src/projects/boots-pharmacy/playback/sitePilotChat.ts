import {
  clearSimulatedClickRipples,
  delay,
  removeDemoCursor as removeSharedDemoCursor,
  simulateDemoPointerClick,
} from "@/app/scenario/demoCursor";
import {
  pinScenarioScrollToBottomDuring,
  scrollPrototypeScrollToBottom,
} from "@/app/scenario/scenarioEngine";
import {
  playbackDiagClick,
  playbackDiagSkip,
  playbackDiagTarget,
  playbackDiagTypeInEnd,
  playbackDiagTypeInProgress,
  playbackDiagTypeInStart,
} from "@/app/shell/playbackDiag";
import {
  beginSitePilotChatPlaybackThinking,
  endSitePilotChatThinking,
  fadeOutSitePilotChatThinking,
} from "@/projects/boots-pharmacy/dom/sitePilotChatThinking";
import {
  findSitePilotChatComposerCard,
  isSitePilotChatAgentReplyFrame,
  SITE_PILOT_CHAT_FINALE_CTA,
  SITE_PILOT_CHAT_PLAYBACK_THINK_MS,
} from "@/projects/boots-pharmacy/dom/sitePilotChatScenario";
import type { BeforeRevealContext } from "@/app/nav/useScenarioPlayback";
import type { AvailOpenIntent } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";

const AGENTIC_QUERY_LINE_PX = 24;
const AGENTIC_QUERY_MAX_LINES = 5;

const TYPING_MS_PER_CHAR = 26;
const TYPING_MS_JITTER = 14;
const SEND_PAUSE_MS = 420;
const CTA_PRESS_MS = 380;

/**
 * Which agent CTA Sarah clicks before each scripted user reply.
 * Keys = 0-based `frameIndex` of the user query being revealed
 * (see useScenarioPlayback beforeReveal). Off-by-one vs 1-based Make indexing
 * broke React chat progressive CTA clicks after migration.
 */
const CTA_BEFORE_USER_FRAME: Record<number, RegExp> = {
  4: /check availability slot for me/i,
  6: /find available slots for today/i,
};

let preludeAborted = false;

export function abortSitePilotChatPlaybackPrelude(): void {
  preludeAborted = true;
  removeSharedDemoCursor({ immediate: true });
  clearSimulatedClickRipples();
  endSitePilotChatThinking();
}

function getChatScreen(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    ".studio-viewport > div > div:nth-child(10)"
  );
}

function getChatScrollEl(): HTMLElement | null {
  const reactCol = document.querySelector<HTMLElement>(
    '[data-studio-react-screen="chat"] .chat__column, main.chat .chat__column'
  );
  if (reactCol) return reactCol;
  return document.querySelector<HTMLElement>(
    ".studio-scroll--prototype:not(.hidden)"
  );
}

function scrollChatToBottom(instant = false): void {
  const scrollEl = getChatScrollEl();
  scrollPrototypeScrollToBottom(scrollEl, instant ? "instant" : "smooth");
}

function syncComposerHeight(ta: HTMLTextAreaElement): void {
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

export function stripSitePilotChatDemoCursors(root: ParentNode = document): void {
  getChatScreen()?.querySelectorAll('[data-name=".utility / cursor"]').forEach((el) => {
    el.remove();
  });
}

export function isSitePilotChatUserQueryFrame(frame: HTMLElement): boolean {
  return frame.matches('[data-name="query"]');
}

export function extractSitePilotChatUserMessageText(
  frame: HTMLElement
): string | null {
  if (!isSitePilotChatUserQueryFrame(frame)) return null;
  const subtotal = frame.querySelector<HTMLElement>('[data-name="Subtotal"]');
  const text = subtotal?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  return text || null;
}

function findCtaInAgentFrame(
  agentFrame: HTMLElement,
  pattern: RegExp
): HTMLElement | null {
  const candidates = Array.from(
    agentFrame.querySelectorAll<HTMLElement>(
      [
        "button.chat__cta",
        "button.uxds-btn-primary",
        '[data-name="component.input.button"]',
      ].join(", ")
    )
  );
  return (
    candidates.find((btn) => {
      // Skip helpful Yes/No strip — same data-name, not a progressive CTA.
      if (btn.closest(".chat__helpful, [data-studio-chat-helpful]")) return false;
      return pattern.test((btn.textContent ?? "").replace(/\s+/g, " ").trim());
    }) ?? null
  );
}

function removeDemoCursor(): void {
  removeSharedDemoCursor({ fade: true });
}

async function simulateSarahCtaClick(button: HTMLElement): Promise<void> {
  if (preludeAborted) return;
  // Pin bottom first — then click with scroll:false so director scroll does not
  // fight scenario scroll pins (scroll-path-deviation → diagnostic-on-step-N).
  scrollChatToBottom(true);
  await delay(80);
  playbackDiagTarget({
    selector: (button.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 64),
    found: true,
    element: button,
    detail: "agentic chat CTA control-point",
  });
  const ok = await simulateDemoPointerClick(button, {
    shouldAbort: () => preludeAborted,
    scroll: false,
  });
  playbackDiagClick({
    ok,
    selector: "chat-agent-cta",
    detail: ok ? "agentic CTA click ok" : "agentic CTA click FAIL",
  });
  if (ok) await delay(CTA_PRESS_MS);
}

async function simulateSarahSendClick(sendBtn: HTMLElement): Promise<void> {
  if (preludeAborted) return;
  scrollChatToBottom(true);
  await delay(80);
  sendBtn.classList.add("proto-agentic-send--sending");
  const ok = await simulateDemoPointerClick(sendBtn, {
    shouldAbort: () => preludeAborted,
    scroll: false,
  });
  sendBtn.classList.remove("proto-agentic-send--sending");
  playbackDiagClick({
    ok,
    selector: "chat-composer-send",
    detail: ok ? "composer send click ok" : "composer send click FAIL",
  });
  if (ok) await delay(SEND_PAUSE_MS);
}

async function pulseComposerSend(): Promise<void> {
  const card = findSitePilotChatComposerCard();
  const sendBtn = card?.querySelector<HTMLElement>(
    ".proto-agentic-send, .site-pilot-composer__send"
  );
  if (!sendBtn) return;
  await simulateSarahSendClick(sendBtn);
}

async function simulateSarahCtaSend(): Promise<void> {
  scrollChatToBottom();
  await delay(220);
}

export async function simulateSarahTypingInComposer(text: string): Promise<void> {
  const card = findSitePilotChatComposerCard();
  const ta = card?.querySelector<HTMLTextAreaElement>(
    "textarea.proto-agentic-query, textarea.site-pilot-composer__query"
  );
  if (!ta) {
    playbackDiagTypeInStart("chat", text.length, "composer missing — delay only");
    playbackDiagTypeInEnd(false, "composer textarea missing");
    await delay(700);
    return;
  }

  playbackDiagTypeInStart("chat", text.length, "chat composer type-in");
  setReactTextareaValue(ta, "");
  syncComposerHeight(ta);
  ta.focus();
  scrollChatToBottom();
  playbackDiagTypeInProgress(0);

  for (let i = 0; i < text.length; i++) {
    if (preludeAborted) {
      setReactTextareaValue(ta, "");
      syncComposerHeight(ta);
      playbackDiagTypeInEnd(false, "aborted");
      return;
    }
    setReactTextareaValue(ta, text.slice(0, i + 1));
    syncComposerHeight(ta);
    playbackDiagTypeInProgress(i + 1);
    if (i % 8 === 0) scrollChatToBottom();
    await delay(TYPING_MS_PER_CHAR + Math.random() * TYPING_MS_JITTER);
  }

  if (preludeAborted) {
    setReactTextareaValue(ta, "");
    syncComposerHeight(ta);
    playbackDiagTypeInEnd(false, "aborted");
    return;
  }

  await pulseComposerSend();
  setReactTextareaValue(ta, "");
  syncComposerHeight(ta);
  playbackDiagTypeInEnd(true, "typed + send");
}

export async function runSitePilotChatBeforeReveal(
  ctx: BeforeRevealContext
): Promise<void> {
  preludeAborted = false;
  const { frame, frameIndex, frames, currentCount } = ctx;

  if (isSitePilotChatAgentReplyFrame(frame)) {
    removeDemoCursor();
    const screen = getChatScreen();
    const scrollEl = getChatScrollEl();
    if (screen) beginSitePilotChatPlaybackThinking(screen, frame);
    if (scrollEl) {
      scrollChatToBottom(true);
      pinScenarioScrollToBottomDuring(
        scrollEl,
        SITE_PILOT_CHAT_PLAYBACK_THINK_MS + 480
      );
    }
    await delay(SITE_PILOT_CHAT_PLAYBACK_THINK_MS);
    if (!preludeAborted) {
      await fadeOutSitePilotChatThinking();
      scrollChatToBottom();
    }
    return;
  }

  if (!isSitePilotChatUserQueryFrame(frame) || frameIndex <= 1) {
    playbackDiagSkip({
      reason: "chat-query-prelude-skip",
      detail: `frameIndex=${frameIndex} — no type/CTA prelude`,
    });
    return;
  }

  const ctaPattern = CTA_BEFORE_USER_FRAME[frameIndex];
  let sentViaCta = false;
  if (ctaPattern) {
    const agentFrame = frames[currentCount - 1];
    if (agentFrame && isSitePilotChatAgentReplyFrame(agentFrame)) {
      const button = findCtaInAgentFrame(agentFrame, ctaPattern);
      if (button) {
        await simulateSarahCtaClick(button);
        sentViaCta = true;
      } else {
        playbackDiagSkip({
          reason: "chat-cta-missing",
          detail: `frameIndex=${frameIndex} CTA pattern unmatched — falling back to type-in`,
        });
      }
    }
  }

  const text = extractSitePilotChatUserMessageText(frame);
  if (!text) {
    playbackDiagSkip({
      reason: "chat-query-text-missing",
      detail: `frameIndex=${frameIndex}`,
    });
    return;
  }

  if (sentViaCta) {
    await simulateSarahCtaSend();
  } else {
    await simulateSarahTypingInComposer(text);
  }
  removeDemoCursor();
}

/** Final scenario beat — Sarah picks a date CTA and leaves chat for Availability Tool. */
export async function runSitePilotChatScenarioFinale(
  openAvailability: (intent: AvailOpenIntent) => void,
  intent: AvailOpenIntent
): Promise<void> {
  preludeAborted = false;

  const screen = getChatScreen();
  const agentReplies = Array.from(
    screen?.querySelectorAll<HTMLElement>('[data-name="reply"]') ?? []
  );
  const lastReply = agentReplies[agentReplies.length - 1];
  const button = lastReply
    ? findCtaInAgentFrame(lastReply, SITE_PILOT_CHAT_FINALE_CTA)
    : null;

  if (button) {
    await simulateSarahCtaClick(button);
  }

  if (!preludeAborted) {
    openAvailability(intent);
  }
}
