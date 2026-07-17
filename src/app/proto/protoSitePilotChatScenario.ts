/**
 * Site Pilot chat — portal composer dock to scroll host (escapes filter/transform traps).
 */

const LEGACY_THREAD_CLASS = "proto-chat-thread";
const DOCK_CLASS = "proto-chat-composer-dock";
const DOCK_PORTAL_CLASS = "proto-chat-composer-dock--portal";
const COMPOSER_CARD_CLASS = "proto-site-pilot-composer";
const COMPOSER_PAD_VAR = "--proto-chat-composer-h";
const SCREEN_CHILD = 10;

function getScrollHost(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".proto-scroll--prototype");
}

function findPortalDock(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `.${DOCK_CLASS}.${DOCK_PORTAL_CLASS}[data-proto-chat-screen="${SCREEN_CHILD}"]`
  );
}

function syncDockGeometry(screen: HTMLElement, dock: HTMLElement): void {
  const summary = screen.querySelector<HTMLElement>(
    '[data-name="component.appointment.summary"]'
  );
  if (!summary) return;

  const rect = summary.getBoundingClientRect();
  dock.style.left = `${rect.left}px`;
  dock.style.width = `${rect.width}px`;

  const h = Math.ceil(dock.getBoundingClientRect().height);
  screen.style.setProperty(COMPOSER_PAD_VAR, `${h}px`);
}

function restoreChatDom(summary: HTMLElement, paddingDiv: HTMLElement): void {
  const thread = summary.querySelector<HTMLElement>(`.${LEGACY_THREAD_CLASS}`);
  if (thread) {
    while (thread.firstChild) {
      summary.insertBefore(thread.firstChild, thread);
    }
    thread.remove();
  }
  summary.classList.remove("proto-chat-layout");

  const dock = findPortalDock() ?? paddingDiv.querySelector<HTMLElement>(`.${DOCK_CLASS}`);
  if (dock) {
    const composer = Array.from(dock.children).find(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && isSitePilotChatComposerFrame(el)
    );
    const disclaimer = dock.querySelector("p");
    if (composer) {
      summary.appendChild(composer);
      composer.classList.remove(COMPOSER_CARD_CLASS);
      delete composer.dataset.protoChatComposer;
    }
    if (disclaimer) {
      paddingDiv.appendChild(disclaimer);
    }
    dock.remove();
  }

  summary
    .querySelectorAll<HTMLElement>('[data-proto-chat-composer="true"]')
    .forEach((el) => delete el.dataset.protoChatComposer);
}

export function isSitePilotChatComposerFrame(el: HTMLElement): boolean {
  const card =
    el.matches('[data-name="component.co.order.summary"]')
      ? el
      : el.querySelector<HTMLElement>('[data-name="component.co.order.summary"]');
  if (!card) return false;
  return /ask boots sitepilot|next dialog options/i.test(card.textContent ?? "");
}

/** Composer card — lives in the portal dock after setup (not under the screen root). */
export function findSitePilotChatComposerCard(): HTMLElement | null {
  const portaled = document.querySelector<HTMLElement>(
    `.${DOCK_CLASS}.${DOCK_PORTAL_CLASS} [data-name="component.co.order.summary"]`
  );
  if (
    portaled &&
    /ask boots sitepilot|next dialog options/i.test(portaled.textContent ?? "")
  ) {
    return portaled;
  }

  const screen = document.querySelector<HTMLElement>(
    ".proto-viewport > div > div:nth-child(10)"
  );
  const cards = Array.from(
    screen?.querySelectorAll<HTMLElement>(
      '[data-name="component.co.order.summary"]'
    ) ?? []
  );
  return (
    cards.find((c) =>
      /ask boots sitepilot|next dialog options/i.test(c.textContent ?? "")
    ) ?? null
  );
}

function findChatDisclaimer(paddingDiv: HTMLElement): HTMLParagraphElement | null {
  for (const child of Array.from(paddingDiv.children)) {
    if (!(child instanceof HTMLParagraphElement)) continue;
    if (child.classList.contains(DOCK_CLASS)) continue;
    if (/sitepilot can make mistakes/i.test(child.textContent ?? "")) {
      return child;
    }
  }
  return null;
}

const dockCleanupByScreen = new WeakMap<HTMLElement, () => void>();

/** Idempotent — safe before scenario frame collection. */
export function ensureSitePilotChatComposerDock(screen: HTMLElement): void {
  const existing = findPortalDock();
  if (existing) {
    syncDockGeometry(screen, existing);
    return;
  }
  dockCleanupByScreen.get(screen)?.();
  dockCleanupByScreen.set(screen, setupSitePilotChatComposerDock(screen));
}

export function teardownSitePilotChatComposerDock(screen: HTMLElement): void {
  dockCleanupByScreen.get(screen)?.();
  dockCleanupByScreen.delete(screen);
}

/** Portal + fixed bottom; messages scroll underneath. */
export function setupSitePilotChatComposerDock(
  screen: HTMLElement
): () => void {
  const body = screen.querySelector<HTMLElement>('[data-name="body"]');
  const summary = body?.querySelector<HTMLElement>(
    '[data-name="component.appointment.summary"]'
  );
  const paddingDiv = summary?.parentElement ?? null;
  const host = getScrollHost() ?? document.body;
  if (!summary || !paddingDiv) return () => {};

  restoreChatDom(summary, paddingDiv);

  const composer = Array.from(summary.children).find(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && isSitePilotChatComposerFrame(child)
  );
  if (!composer) return () => {};

  composer.dataset.protoChatComposer = "true";
  composer.classList.add(COMPOSER_CARD_CLASS);
  const disclaimer = findChatDisclaimer(paddingDiv);

  const dock = document.createElement("div");
  dock.className = `${DOCK_CLASS} ${DOCK_PORTAL_CLASS}`;
  dock.dataset.protoChatScreen = String(SCREEN_CHILD);
  dock.appendChild(composer);
  if (disclaimer) dock.appendChild(disclaimer);
  host.appendChild(dock);

  screen.classList.add("proto-chat-screen");

  const onReposition = () => syncDockGeometry(screen, dock);

  const ro = new ResizeObserver(onReposition);
  ro.observe(dock);
  host.addEventListener("scroll", onReposition, { passive: true });
  window.addEventListener("resize", onReposition);
  onReposition();

  syncSitePilotChatFeedbackFrame(screen);

  return () => {
    ro.disconnect();
    host.removeEventListener("scroll", onReposition);
    window.removeEventListener("resize", onReposition);
    screen.classList.remove("proto-chat-screen");
    screen.style.removeProperty(COMPOSER_PAD_VAR);
    restoreChatDom(summary, paddingDiv);
  };
}

export function collectSitePilotChatScenarioFrames(
  screen: ParentNode
): HTMLElement[] {
  const summary = screen.querySelector<HTMLElement>(
    '[data-name="component.appointment.summary"]'
  );
  if (!summary) return [];

  return Array.from(summary.children).filter(
    (node): node is HTMLElement =>
      node instanceof HTMLElement &&
      !isSitePilotChatComposerFrame(node) &&
      !node.hasAttribute("data-proto-chat-thinking") &&
      !isSitePilotChatFeedbackFrame(node)
  );
}

/** Agent reply bubbles — show thinking pause before these during play. */
export function isSitePilotChatAgentReplyFrame(frame: HTMLElement): boolean {
  return frame.matches('[data-name="reply"]');
}

/** Helpfulness prompt — not part of the stepped chat thread. */
export function isSitePilotChatFeedbackFrame(frame: HTMLElement): boolean {
  return /was this conversation helpful/i.test(frame.textContent ?? "");
}

export const SITE_PILOT_CHAT_PLAYBACK_THINK_MS = 1400;

export const SITE_PILOT_CHAT_FINALE_CTA = /choose different date/i;

/** Keep helpfulness prompt out of the stepped thread (finale ends on date CTA). */
export function syncSitePilotChatFeedbackFrame(screen: ParentNode): void {
  const summary = screen.querySelector<HTMLElement>(
    '[data-name="component.appointment.summary"]'
  );
  if (!summary) return;

  Array.from(summary.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    if (!isSitePilotChatFeedbackFrame(child)) return;
    child.classList.add("proto-chat-feedback-frame");
    child.hidden = true;
  });
}
