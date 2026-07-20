import {
  clearSimulatedClickRipples,
  delay,
  holdDemoCursorAtLastClick,
  isDemoCursorHeldAtLastClick,
  removeDemoCursor as removeSharedDemoCursor,
  simulateDemoPointerClick,
} from "@/app/scenario/demoCursor";
import {
  pinScenarioScrollToBottomDuring,
  scrollPrototypeScrollToBottom,
} from "@/app/scenario/scenarioEngine";
import { animateScrollElementIntoView } from "@/app/scenario/playbackScroll";
import {
  playbackDiagClick,
  playbackDiagLog,
  playbackDiagSkip,
  playbackDiagTarget,
  playbackDiagTypeInEnd,
  playbackDiagTypeInProgress,
  playbackDiagTypeInStart,
} from "@/app/shell/playbackDiag";
import {
  beginTypeInCursorGuard,
  tickTypeInCursorGuard,
} from "@/app/shell/typeInCursorGuard";
import { playbackScrollMonitor } from "@/app/shell/playbackScrollMonitor";
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
import { logChatReveal } from "@/projects/boots-pharmacy/screens/chat/chatScenarioRevealBridge";
import { CHAT_PULL_UP } from "@/projects/boots-pharmacy/screens/chat/chatMotion";
import { CHAT_THREAD_FRAMES } from "@/projects/boots-pharmacy/screens/chat/chatThreadContent";

const CHAT_PULL_UP_MS = Math.round(CHAT_PULL_UP.transition.duration * 1000);

const AGENTIC_QUERY_LINE_PX = 24;
const AGENTIC_QUERY_MAX_LINES = 5;

const TYPING_MS_PER_CHAR = 26;
const TYPING_MS_JITTER = 14;
const SEND_PAUSE_MS = 420;
const CTA_PRESS_MS = 380;

/**
 * Which agent CTA Sarah clicks before each scripted user reply.
 * Keys = `frameIndex` from useScenarioPlayback beforeReveal = **1-based**
 * next visibleCount (NOT 0-based array index). Make truth (pre-React Chat,
 * tip a2c86ba / 5fdde78^): 5 → q2 after r1 CTA; 7 → q3 after r2 CTA.
 */
/** Exported for ratchet tests — Make 1-based frameIndex keys. */
export const SITE_PILOT_CHAT_CTA_BEFORE_USER_FRAME: Record<number, RegExp> = {
  5: /check availability slot for me/i,
  7: /find available slots for today/i,
};
const CTA_BEFORE_USER_FRAME = SITE_PILOT_CHAT_CTA_BEFORE_USER_FRAME;

/*
 * Make / pre-React agentic chat sequence (source of truth):
 * frames 0..7 = q0,r0,q1,r1,q2,r2,q3,r3 (+ finale virtual)
 *  land → q0
 *  step → THINKING (left) → r0
 *  step → type-in q1 (no CTA) → q1
 *  step → THINKING → r1
 *  step → click r1 CTA "Check availability…" → q2
 *  step → THINKING → r2
 *  step → click r2 CTA "Find available slots for today" → q3
 *  step → THINKING → r3
 *  finale → click "Choose Different Date" → avail
 * Think hold = SITE_PILOT_CHAT_PLAYBACK_THINK_MS (~1400).
 */

let preludeAborted = false;

export function abortSitePilotChatPlaybackPrelude(): void {
  preludeAborted = true;
  if (!isDemoCursorHeldAtLastClick()) {
    removeDemoCursorImmediate();
  }
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

/** Abort path only — hard-remove. Post-click uses holdDemoCursorAtLastClick. */
function removeDemoCursorImmediate(): void {
  removeSharedDemoCursor({ immediate: true });
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
  if (ok) {
    holdDemoCursorAtLastClick();
    await delay(CTA_PRESS_MS);
  }
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
  if (ok) {
    holdDemoCursorAtLastClick();
    await delay(SEND_PAUSE_MS);
  }
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
  beginTypeInCursorGuard(ta);
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
    tickTypeInCursorGuard(ta, i + 1);
    playbackDiagTypeInProgress(i + 1);
    if (i % 8 === 0) {
      scrollChatToBottom();
      // Composer growth + pin scrolls look like path deviation mid type-in.
      playbackScrollMonitor.noteRetreatSync();
    }
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
  // useScenarioPlayback passes frameIndex = next visibleCount (1-based).
  const zeroIndex = Math.max(0, frames.indexOf(frame));
  // Prefer DOM marker; fall back to scripted React playlist ids (q0/r0…).
  const scriptedId = CHAT_THREAD_FRAMES[zeroIndex]?.id ?? null;
  const frameId =
    frame.getAttribute("data-studio-chat-frame") ??
    scriptedId ??
    (isSitePilotChatAgentReplyFrame(frame)
      ? `r${Math.max(0, Math.floor((zeroIndex - 1) / 2))}`
      : isSitePilotChatUserQueryFrame(frame)
        ? `q${Math.max(0, Math.floor(zeroIndex / 2))}`
        : "?");
  // Only annotate React playlist nodes — stamping Make dump-all lets
  // collectSitePilotChatScenarioFrames short-circuit to a 2-frame subset.
  if (
    !frame.getAttribute("data-studio-chat-frame") &&
    scriptedId &&
    frame.closest(
      ".studio-react-screen-host, main.chat[data-studio-react-screen='chat']"
    )
  ) {
    frame.setAttribute("data-studio-chat-frame", scriptedId);
  }

  // Chat type-in / thinking / pin scrolls compete with camera ease — grace only,
  // not director-script stack watch (that false-failed user-send steps).
  playbackScrollMonitor.noteRetreatSync();

  if (isSitePilotChatAgentReplyFrame(frame)) {
    // Stay on last click point through thinking — do not fade/park-away.
    holdDemoCursorAtLastClick();
    const screen = getChatScreen();
    const scrollEl = getChatScrollEl();
    // First agent reply (r0) MUST show thinking — never skip for frame 0/handoff.
    const anchorId = frameId.startsWith("r") || frameId.startsWith("q")
      ? frameId
      : scriptedId ?? "r0";
    logChatReveal({
      kind: "thinking",
      index: zeroIndex,
      visibleCount: currentCount,
      frameId: anchorId,
    });
    playbackDiagLog(
      "info",
      `thinking-start before reply ${anchorId} (frameIndex=${frameIndex} zero=${zeroIndex})`
    );
    if (screen) {
      beginSitePilotChatPlaybackThinking(screen, frame, {
        anchorFrameId: anchorId,
      });
    }
    if (scrollEl) {
      scrollChatToBottom(true);
      // Think + pull-up settle — keep bottom pin so new reply never sits under dock.
      pinScenarioScrollToBottomDuring(
        scrollEl,
        SITE_PILOT_CHAT_PLAYBACK_THINK_MS + CHAT_PULL_UP_MS + 160
      );
    }
    await delay(SITE_PILOT_CHAT_PLAYBACK_THINK_MS);
    if (!preludeAborted) {
      await fadeOutSitePilotChatThinking();
      scrollChatToBottom(true);
      // Reply mounts after beforeReveal returns — schedule clearance then.
      const clearAboveComposer = () => {
        if (preludeAborted) return;
        const col = getChatScrollEl();
        const last = col?.querySelector<HTMLElement>(
          `[data-studio-chat-frame="${anchorId}"]`
        );
        if (col && last) {
          void animateScrollElementIntoView(last, {
            scrollEl: col,
            align: "end",
          });
        } else {
          scrollChatToBottom(true);
        }
      };
      window.setTimeout(clearAboveComposer, 80);
      window.setTimeout(clearAboveComposer, CHAT_PULL_UP_MS + 40);
      logChatReveal({
        kind: "agent",
        index: zeroIndex,
        visibleCount: currentCount + 1,
        frameId: anchorId,
      });
      playbackDiagLog(
        "info",
        `thinking-end → reveal reply ${anchorId} (frameIndex=${frameIndex} zero=${zeroIndex})`
      );
    } else {
      playbackDiagLog(
        "info",
        `thinking-abort before reply ${anchorId} (frameIndex=${frameIndex})`
      );
    }
    return;
  }

  if (!isSitePilotChatUserQueryFrame(frame) || frameIndex <= 1) {
    if (isSitePilotChatUserQueryFrame(frame)) {
      logChatReveal({
        kind: "user",
        index: zeroIndex,
        visibleCount: currentCount + 1,
        frameId,
      });
    }
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
  holdDemoCursorAtLastClick();
  // PO: Sarah send never shows thinking — clear any send-thinking the
  // composer click may have latched (React/wire). Agent thinking starts
  // only on the next beforeReveal for a reply frame.
  endSitePilotChatThinking();
  logChatReveal({
    kind: "user",
    index: zeroIndex,
    visibleCount: currentCount + 1,
    frameId,
  });
  playbackDiagLog(
    "info",
    `user-send complete frameIndex=${frameIndex} zero=${zeroIndex} — no thinking until agent reply`
  );
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

  // Open Availability even if cursor/prelude aborted mid-click (overlay idle,
  // scroll-path diagnostic). Product path must continue to avail tool.
  openAvailability(intent);
}
