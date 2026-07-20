import { animateScrollTo } from "@/app/scenario/playbackScroll";
import { isChatReactMounted } from "@/projects/boots-pharmacy/screens/chat/chatContract";
import {
  clearChatThinkingBridge,
  publishChatThinkingBridge,
} from "@/projects/boots-pharmacy/screens/chat/chatThinkingBridge";

const THINKING_ATTR = "data-studio-chat-thinking";
const THINKING_CLASS = "proto-chat-thinking-bubble";

const STOP_GLYPH_HTML = `<svg class="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" rx="1.5" fill="#ffffff"/></svg>`;

export type SitePilotChatThinkingMode = "none" | "hint" | "playback" | "send";

let thinkingMode: SitePilotChatThinkingMode = "none";

function resolveAnchorFrameId(anchorFrame?: HTMLElement): string | null {
  if (!anchorFrame) return null;
  return anchorFrame.getAttribute("data-studio-chat-frame");
}

function resolveSummary(screenOrSummary: ParentNode): HTMLElement | null {
  if (
    screenOrSummary instanceof HTMLElement &&
    screenOrSummary.matches('[data-name="component.appointment.summary"]')
  ) {
    return screenOrSummary;
  }
  return screenOrSummary.querySelector<HTMLElement>(
    '[data-name="component.appointment.summary"]'
  );
}

function insertAfter(newNode: Node, referenceNode: Node): void {
  const parent = referenceNode.parentNode;
  if (!parent) return;
  parent.insertBefore(newNode, referenceNode.nextSibling);
}

function positionThinkingBubble(
  summary: HTMLElement,
  bubble: HTMLElement,
  mode: Exclude<SitePilotChatThinkingMode, "none">,
  anchorFrame?: HTMLElement
): void {
  if (mode === "send") {
    const threadChildren = Array.from(summary.children).filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement &&
        node !== bubble &&
        !node.hasAttribute("data-studio-chat-thinking")
    );
    const last = threadChildren[threadChildren.length - 1];
    if (last) insertAfter(bubble, last);
    else summary.appendChild(bubble);
    return;
  }

  if (mode === "playback" && anchorFrame?.parentElement === summary) {
    summary.insertBefore(bubble, anchorFrame);
    return;
  }

  if (mode === "hint") {
    if (anchorFrame?.parentElement === summary) {
      insertAfter(bubble, anchorFrame);
      return;
    }
    const firstReply = summary.querySelector<HTMLElement>('[data-name="reply"]');
    if (firstReply?.parentElement === summary) {
      summary.insertBefore(bubble, firstReply);
      return;
    }
  }

  const firstReply = summary.querySelector<HTMLElement>('[data-name="reply"]');
  if (firstReply?.parentElement === summary) {
    summary.insertBefore(bubble, firstReply);
  } else {
    summary.appendChild(bubble);
  }
}

function ensureThinkingBubble(
  summary: HTMLElement,
  mode: Exclude<SitePilotChatThinkingMode, "none">,
  anchorFrame?: HTMLElement
): HTMLElement {
  let bubble = summary.querySelector<HTMLElement>(`[${THINKING_ATTR}]`);
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.setAttribute(THINKING_ATTR, "true");
    bubble.className = THINKING_CLASS;
    bubble.hidden = true;
    bubble.setAttribute("role", "status");
    bubble.setAttribute("aria-live", "polite");
    bubble.innerHTML = `
    <div class="proto-chat-thinking-bubble__inner">
      <span class="proto-chat-thinking-dots" aria-hidden="true">
        <span></span><span></span><span></span>
      </span>
      <span class="proto-chat-thinking-bubble__sr">SitePilot is thinking</span>
    </div>
  `.trim();
    summary.appendChild(bubble);
  }

  positionThinkingBubble(summary, bubble, mode, anchorFrame);
  return bubble;
}

function scrollChatToBottom(): void {
  const scrollEl =
    document.querySelector<HTMLElement>(
      '[data-studio-react-screen="chat"] .chat__column, main.chat .chat__column'
    ) ??
    document.querySelector<HTMLElement>(
      ".studio-scroll--prototype:not(.hidden)"
    );
  if (!scrollEl) return;
  const resolveBottom = () =>
    Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
  void animateScrollTo(scrollEl, resolveBottom(), {
    resolveTargetTop: resolveBottom,
  });
}

function restartThinkingAnimation(bubble: HTMLElement): void {
  bubble.classList.remove("proto-chat-thinking-bubble--reveal");
  void bubble.offsetWidth;
  bubble.classList.add("proto-chat-thinking-bubble--reveal");

  const dots = bubble.querySelector<HTMLElement>(".proto-chat-thinking-dots");
  if (dots) {
    dots.classList.remove("proto-chat-thinking-dots--run");
    void dots.offsetWidth;
    dots.classList.add("proto-chat-thinking-dots--run");
  }
}

function showThinkingBubble(
  summary: HTMLElement,
  mode: Exclude<SitePilotChatThinkingMode, "none">,
  scroll: boolean,
  anchorFrame?: HTMLElement,
  anchorFrameIdOverride?: string | null
): void {
  thinkingMode = mode;

  if (isChatReactMounted()) {
    // Explicit id wins — Make/handoff frames often lack data-studio-chat-frame.
    // First agent reply MUST anchor to r0 or React paints reply with no thinking.
    publishChatThinkingBridge({
      mode,
      anchorFrameId:
        anchorFrameIdOverride ?? resolveAnchorFrameId(anchorFrame) ?? "r0",
    });
    if (scroll) scrollChatToBottom();
    return;
  }

  const bubble = ensureThinkingBubble(summary, mode, anchorFrame);
  bubble.hidden = false;
  bubble.classList.toggle("proto-chat-thinking-bubble--hint", mode === "hint" || mode === "playback");
  restartThinkingAnimation(bubble);
  if (scroll) scrollChatToBottom();
}

export function isSitePilotChatThinking(): boolean {
  return thinkingMode !== "none";
}

export function isSitePilotChatSendThinking(): boolean {
  return thinkingMode === "send";
}

export function isSitePilotChatHintThinking(): boolean {
  return thinkingMode === "hint";
}

export function isSitePilotChatPlaybackThinking(): boolean {
  return thinkingMode === "playback";
}

/** Ambient hint on frame 1 — indicates the chat is live. */
export function syncSitePilotChatThinkingHint(
  screenOrSummary: ParentNode | null,
  show: boolean,
  anchorAfter?: HTMLElement
): void {
  if (!show) {
    if (thinkingMode === "hint") endSitePilotChatThinking();
    return;
  }
  if (thinkingMode === "send" || thinkingMode === "playback") return;

  const summary = screenOrSummary ? resolveSummary(screenOrSummary) : null;
  if (!summary) return;

  showThinkingBubble(summary, "hint", false, anchorAfter);
}

export function beginSitePilotChatThinking(screenOrSummary: ParentNode): void {
  const summary = resolveSummary(screenOrSummary);
  if (!summary || thinkingMode === "send") return;

  showThinkingBubble(summary, "send", true);
}

/** Pre-reveal pause while scenario play advances onto an agent reply. */
export function beginSitePilotChatPlaybackThinking(
  screenOrSummary: ParentNode,
  anchorFrame?: HTMLElement,
  options?: { scroll?: boolean; anchorFrameId?: string | null }
): void {
  const summary = resolveSummary(screenOrSummary);
  if (!summary) return;
  // Playback thinking always wins — never leave a send-thinking latch
  // blocking the agent-turn bubble (user send must not own thinking).
  if (thinkingMode === "send" || thinkingMode === "hint") {
    thinkingMode = "none";
    clearChatThinkingBridge();
  }

  // Belt-and-suspenders: reply slot must be visible while thinking paints
  // inside it (engine may still have display:none until preludeTargetCount).
  if (anchorFrame) {
    anchorFrame.style.display = "";
    anchorFrame.classList.remove("proto-scenario-frame--hidden");
    anchorFrame.dataset.studioScenarioVisible = "true";
  }

  showThinkingBubble(
    summary,
    "playback",
    options?.scroll ?? true,
    anchorFrame,
    options?.anchorFrameId
  );
}

export function endSitePilotChatThinking(): void {
  thinkingMode = "none";
  clearChatThinkingBridge();
  document.querySelectorAll<HTMLElement>(`[${THINKING_ATTR}]`).forEach((bubble) => {
    bubble.hidden = true;
    bubble.classList.remove(
      "proto-chat-thinking-bubble--reveal",
      "proto-chat-thinking-bubble--hint",
      "proto-chat-thinking-bubble--exit",
      "chat__thinking--hint"
    );
    bubble
      .querySelector(".proto-chat-thinking-dots, .chat__thinking-dots")
      ?.classList.remove("proto-chat-thinking-dots--run");
  });
}

const THINKING_EXIT_MS = 360;

/** Fade thinking bubble out before the agent reply frame reveals (same motion language). */
export async function fadeOutSitePilotChatThinking(): Promise<void> {
  if (isChatReactMounted()) {
    // Do NOT clear before beforeReveal returns — that left an empty agent slot
    // until visibleCount advanced (then a 200–300px reveal-snap). Schedule
    // clear after publish so thinking holds until the reply frame is in count.
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        endSitePilotChatThinking();
      });
    });
    return;
  }

  const bubbles = Array.from(
    document.querySelectorAll<HTMLElement>(`[${THINKING_ATTR}]`)
  ).filter((bubble) => !bubble.hidden);

  if (bubbles.length === 0) {
    endSitePilotChatThinking();
    return;
  }

  bubbles.forEach((bubble) => {
    bubble.classList.remove("proto-chat-thinking-bubble--reveal");
    bubble.classList.add("proto-chat-thinking-bubble--exit");
    bubble
      .querySelector(".proto-chat-thinking-dots")
      ?.classList.remove("proto-chat-thinking-dots--run");
  });

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, THINKING_EXIT_MS);
  });
  endSitePilotChatThinking();
}

function isReactOwnedSendButton(sendBtn: HTMLElement): boolean {
  // React `SitePilotComposer` owns stop/send via `sendThinking` — never touch its glyph DOM.
  return (
    isChatReactMounted() ||
    Boolean(
      sendBtn.closest(
        "[data-studio-chat-composer], [data-studio-react-screen], .site-pilot-composer__query-row"
      )
    )
  );
}

export function setSitePilotChatSendThinkingMode(
  sendBtn: HTMLElement,
  thinking: boolean
): void {
  // Imperative glyphHost.innerHTML + React SendGlyph/StopGlyph swap = removeChild crash
  // (agentic Play / composer click). LEGACY Make composer only.
  if (isReactOwnedSendButton(sendBtn)) return;

  sendBtn.classList.toggle("proto-agentic-send--stop", thinking);
  sendBtn.classList.toggle("site-pilot-composer__send--stop", thinking);
  sendBtn.setAttribute("aria-label", thinking ? "Stop" : "Send message");

  const glyphHost = sendBtn.querySelector<HTMLElement>('[data-name="glyph"]');
  if (!glyphHost) return;

  if (thinking) {
    if (!sendBtn.dataset.studioSendGlyphHtml) {
      sendBtn.dataset.studioSendGlyphHtml = glyphHost.innerHTML;
    }
    glyphHost.innerHTML = STOP_GLYPH_HTML;
    return;
  }

  if (sendBtn.dataset.studioSendGlyphHtml) {
    glyphHost.innerHTML = sendBtn.dataset.studioSendGlyphHtml;
    delete sendBtn.dataset.studioSendGlyphHtml;
  }
  glyphHost.querySelectorAll("path").forEach((path) => {
    path.setAttribute("fill", "#ffffff");
  });
}
