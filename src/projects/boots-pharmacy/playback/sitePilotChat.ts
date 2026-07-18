import {
  clearSimulatedClickRipples,
  delay,
  moveDemoCursorTo,
  notifyStudioDemoClick,
  removeDemoCursor as removeSharedDemoCursor,
  settleDemoCursorAfterClick,
  targetCenter,
} from "@/app/proto/protoDemoCursor";
import { scrollPrototypeScrollToBottom } from "@/app/proto/protoScenarioEngine";
import {
  beginSitePilotChatPlaybackThinking,
  endSitePilotChatThinking,
} from "@/projects/boots-pharmacy/dom/protoSitePilotChatThinking";
import {
  findSitePilotChatComposerCard,
  isSitePilotChatAgentReplyFrame,
  SITE_PILOT_CHAT_FINALE_CTA,
  SITE_PILOT_CHAT_PLAYBACK_THINK_MS,
} from "@/projects/boots-pharmacy/dom/protoSitePilotChatScenario";
import type { BeforeRevealContext } from "@/app/nav/useProtoScenarioPlayback";
import type { AvailOpenIntent } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";

const AGENTIC_QUERY_LINE_PX = 24;
const AGENTIC_QUERY_MAX_LINES = 5;

const TYPING_MS_PER_CHAR = 26;
const TYPING_MS_JITTER = 14;
const SEND_PAUSE_MS = 420;
const CTA_PRESS_MS = 380;

/** Which agent CTA Sarah clicks before each scripted user reply. */
const CTA_BEFORE_USER_FRAME: Record<number, RegExp> = {
  5: /check availability slot for me/i,
  7: /find available slots for today/i,
};

let preludeAborted = false;

export function abortSitePilotChatPlaybackPrelude(): void {
  preludeAborted = true;
  removeSharedDemoCursor();
  clearSimulatedClickRipples();
  endSitePilotChatThinking();
}

function getChatScreen(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    ".proto-viewport > div > div:nth-child(10)"
  );
}

function scrollChatToBottom(): void {
  const scrollEl = document.querySelector<HTMLElement>(
    ".proto-scroll--prototype:not(.hidden)"
  );
  scrollPrototypeScrollToBottom(scrollEl, "smooth");
}

function syncComposerHeight(ta: HTMLTextAreaElement): void {
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
  return (
    Array.from(
      agentFrame.querySelectorAll<HTMLElement>(
        '[data-name="component.input.button"]'
      )
    ).find((btn) => pattern.test(btn.textContent ?? "")) ?? null
  );
}

function removeDemoCursor(): void {
  removeSharedDemoCursor();
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

async function simulateSarahCtaClick(button: HTMLElement): Promise<void> {
  if (preludeAborted) return;

  const cursor = await moveDemoCursorTo(button, { syncPageScroll: true });
  if (!cursor || preludeAborted) return;

  button.classList.add("proto-chat-cta--hover");

  const { x, y } = targetCenter(button);
  spawnSimulatedClickRipple(x, y);
  tapDemoCursor(cursor);
  notifyStudioDemoClick();

  button.classList.add("proto-chat-cta--pressed");
  await delay(CTA_PRESS_MS);
  button.classList.remove("proto-chat-cta--pressed", "proto-chat-cta--hover");
  settleDemoCursorAfterClick(cursor, button);
  await delay(160);
}

async function simulateSarahSendClick(sendBtn: HTMLElement): Promise<void> {
  if (preludeAborted) return;

  const cursor = await moveDemoCursorTo(sendBtn, { syncPageScroll: true });
  if (!cursor || preludeAborted) return;

  const { x, y } = targetCenter(sendBtn);
  spawnSimulatedClickRipple(x, y);
  tapDemoCursor(cursor);
  notifyStudioDemoClick();

  sendBtn.classList.add("proto-agentic-send--sending");
  await delay(SEND_PAUSE_MS);
  sendBtn.classList.remove("proto-agentic-send--sending");
  settleDemoCursorAfterClick(cursor, sendBtn);
  await delay(160);
}

async function pulseComposerSend(): Promise<void> {
  const card = findSitePilotChatComposerCard();
  const sendBtn = card?.querySelector<HTMLElement>(".proto-agentic-send");
  if (!sendBtn) return;
  await simulateSarahSendClick(sendBtn);
}

async function simulateSarahCtaSend(): Promise<void> {
  scrollChatToBottom();
  await delay(220);
}

export async function simulateSarahTypingInComposer(text: string): Promise<void> {
  const card = findSitePilotChatComposerCard();
  const ta = card?.querySelector<HTMLTextAreaElement>("textarea.proto-agentic-query");
  if (!ta) {
    await delay(700);
    return;
  }

  ta.value = "";
  syncComposerHeight(ta);
  ta.focus();
  scrollChatToBottom();

  for (let i = 0; i < text.length; i++) {
    if (preludeAborted) {
      ta.value = "";
      syncComposerHeight(ta);
      return;
    }
    ta.value = text.slice(0, i + 1);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    syncComposerHeight(ta);
    if (i % 8 === 0) scrollChatToBottom();
    await delay(TYPING_MS_PER_CHAR + Math.random() * TYPING_MS_JITTER);
  }

  if (preludeAborted) {
    ta.value = "";
    syncComposerHeight(ta);
    return;
  }

  await pulseComposerSend();
  ta.value = "";
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  syncComposerHeight(ta);
}

export async function runSitePilotChatBeforeReveal(
  ctx: BeforeRevealContext
): Promise<void> {
  preludeAborted = false;
  const { frame, frameIndex, frames, currentCount } = ctx;

  if (isSitePilotChatAgentReplyFrame(frame)) {
    removeDemoCursor();
    const screen = getChatScreen();
    if (screen) beginSitePilotChatPlaybackThinking(screen, frame);
    scrollChatToBottom();
    await delay(SITE_PILOT_CHAT_PLAYBACK_THINK_MS);
    if (!preludeAborted) endSitePilotChatThinking();
    return;
  }

  if (!isSitePilotChatUserQueryFrame(frame) || frameIndex <= 1) return;

  const ctaPattern = CTA_BEFORE_USER_FRAME[frameIndex];
  let sentViaCta = false;
  if (ctaPattern) {
    const agentFrame = frames[currentCount - 1];
    if (agentFrame && isSitePilotChatAgentReplyFrame(agentFrame)) {
      const button = findCtaInAgentFrame(agentFrame, ctaPattern);
      if (button) {
        await simulateSarahCtaClick(button);
        sentViaCta = true;
      }
    }
  }

  const text = extractSitePilotChatUserMessageText(frame);
  if (!text) return;

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
