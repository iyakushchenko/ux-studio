/**
 * Site Pilot chat — in-place fixed composer (stays in React tree during CJM frame steps).
 */

import { playbackScrollMonitor } from "@/app/shell/playbackScrollMonitor";
import { isChatReactMounted } from "@/projects/boots-pharmacy/screens/chat/mountChatScreen";

const LEGACY_THREAD_CLASS = "proto-chat-thread";
const DOCK_CLASS = "proto-chat-composer-dock";
const DOCK_IN_PLACE_CLASS = "proto-chat-composer-dock--in-place";
const DOCK_PORTAL_CLASS = "proto-chat-composer-dock--portal";
const DISCLAIMER_CLASS = "proto-chat-composer-disclaimer";
const COMPOSER_CARD_CLASS = "proto-site-pilot-composer";
const COMPOSER_PAD_VAR = "--proto-chat-composer-h";
const SCREEN_CHILD = 10;

function getScrollHost(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>(
      ".studio-scroll--prototype:not(.hidden)"
    ) ?? document.querySelector<HTMLElement>(".studio-scroll--prototype")
  );
}

function getChatSummary(screen: ParentNode): HTMLElement | null {
  return screen.querySelector<HTMLElement>(
    '[data-name="component.appointment.summary"]'
  );
}

function findPortalDock(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `.${DOCK_CLASS}.${DOCK_PORTAL_CLASS}[data-studio-chat-screen="${SCREEN_CHILD}"]`
  );
}

function findInPlaceComposer(screen: ParentNode): HTMLElement | null {
  const summary = getChatSummary(screen);
  if (!summary) return null;
  return (
    summary.querySelector<HTMLElement>(
      `.${COMPOSER_CARD_CLASS}[data-studio-chat-composer="true"]`
    ) ?? findSummaryComposer(summary)
  );
}

function findSummaryComposer(summary: HTMLElement): HTMLElement | null {
  return (
    Array.from(summary.children).find(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && isSitePilotChatComposerFrame(child)
    ) ?? null
  );
}

const dockCleanupByScreen = new WeakMap<HTMLElement, () => void>();
const disclaimerByScreen = new WeakMap<HTMLElement, HTMLParagraphElement>();

const COMPOSER_DOCK_PAD_BOTTOM_PX = 24;
const COMPOSER_DOCK_PAD_TOP_PX = 12;
const COMPOSER_DISCLAIMER_GAP_PX = 8;

function syncInPlaceGeometry(
  screen: HTMLElement,
  summary: HTMLElement,
  composer: HTMLElement
): void {
  const scrollHost = getScrollHost();
  const prevMaxScroll =
    scrollHost != null
      ? Math.max(0, scrollHost.scrollHeight - scrollHost.clientHeight)
      : null;
  const prevTop = scrollHost?.scrollTop ?? null;
  const nearBottom =
    scrollHost != null &&
    prevMaxScroll != null &&
    prevTop != null &&
    prevMaxScroll - prevTop < 120;

  const rect = summary.getBoundingClientRect();
  const disclaimer = disclaimerByScreen.get(screen);

  composer.style.left = `${rect.left}px`;
  composer.style.width = `${rect.width}px`;

  let disclaimerBlock = 0;
  if (disclaimer) {
    disclaimer.style.left = `${rect.left}px`;
    disclaimer.style.width = `${rect.width}px`;
    disclaimer.style.bottom = `${COMPOSER_DOCK_PAD_BOTTOM_PX}px`;
    disclaimerBlock =
      disclaimer.getBoundingClientRect().height + COMPOSER_DISCLAIMER_GAP_PX;
  }

  composer.style.bottom = `${COMPOSER_DOCK_PAD_BOTTOM_PX + disclaimerBlock}px`;

  const composerH = composer.getBoundingClientRect().height;
  const totalH =
    COMPOSER_DOCK_PAD_TOP_PX +
    composerH +
    disclaimerBlock +
    COMPOSER_DOCK_PAD_BOTTOM_PX;
  const prevPad = parseFloat(
    screen.style.getPropertyValue(COMPOSER_PAD_VAR) || "0"
  );
  const nextPad = Math.ceil(totalH);
  screen.style.setProperty(COMPOSER_PAD_VAR, `${nextPad}px`);

  if (scrollHost && prevMaxScroll != null && prevTop != null && prevPad !== nextPad) {
    const newMaxScroll = Math.max(
      0,
      scrollHost.scrollHeight - scrollHost.clientHeight
    );
    const maxDelta = newMaxScroll - prevMaxScroll;
    if (maxDelta !== 0 && nearBottom) {
      scrollHost.scrollTop = Math.max(0, prevTop + maxDelta);
    }
    playbackScrollMonitor.onPinApply(scrollHost.scrollTop);
  }
}

function applyComposerDockSuppressed(screen?: ParentNode | null): void {
  const suppressed = document.body.hasAttribute(
    "data-studio-chat-composer-suppressed"
  );
  const composer = findInPlaceComposer(
    screen ??
      document.querySelector<HTMLElement>(
        ".studio-viewport > div > div:nth-child(10)"
      ) ??
      document
  );
  if (composer) {
    composer.hidden = suppressed;
    const screen = document.querySelector<HTMLElement>(
      ".studio-viewport > div > div:nth-child(10)"
    );
    const disclaimer = screen ? disclaimerByScreen.get(screen) : null;
    if (disclaimer) disclaimer.hidden = suppressed;
    return;
  }
  const dock = findPortalDock();
  if (dock) dock.hidden = suppressed;
}

function clearComposerScenarioStyles(composer: HTMLElement): void {
  const id = composer.dataset.studioScenarioHideTid;
  if (id) window.clearTimeout(Number(id));
  composer.classList.remove("proto-scenario-frame", "proto-scenario-frame--hidden");
  composer.style.display = "";
  delete composer.dataset.studioScenarioVisible;
  delete composer.dataset.studioScenarioFrame;
  delete composer.dataset.studioScenarioHideTid;
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

  summary
    .querySelectorAll<HTMLElement>(`.${COMPOSER_CARD_CLASS}[data-studio-chat-composer="true"]`)
    .forEach((composer) => {
      composer.classList.remove(COMPOSER_CARD_CLASS, DOCK_IN_PLACE_CLASS);
      composer.style.removeProperty("left");
      composer.style.removeProperty("width");
      composer.style.removeProperty("bottom");
      composer.hidden = false;
      delete composer.dataset.studioChatComposer;
    });

  paddingDiv
    .querySelectorAll<HTMLParagraphElement>(`.${DISCLAIMER_CLASS}`)
    .forEach((disclaimer) => {
      disclaimer.classList.remove(DISCLAIMER_CLASS);
      disclaimer.style.removeProperty("left");
      disclaimer.style.removeProperty("width");
      disclaimer.style.removeProperty("bottom");
      disclaimer.hidden = false;
    });

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
      delete composer.dataset.studioChatComposer;
    }
    if (disclaimer) {
      paddingDiv.appendChild(disclaimer);
    }
    dock.remove();
  }

  summary
    .querySelectorAll<HTMLElement>('[data-studio-chat-composer="true"]')
    .forEach((el) => delete el.dataset.studioChatComposer);
}

export function isSitePilotChatComposerFrame(el: HTMLElement): boolean {
  if (el.dataset.studioChatComposer === "true") return true;
  if (el.classList.contains(COMPOSER_CARD_CLASS)) return true;
  if (el.matches('[data-name="query"], [data-name="reply"]')) return false;

  const card = el.matches('[data-name="component.co.order.summary"]')
    ? el
    : el.querySelector<HTMLElement>(':scope > [data-name="component.co.order.summary"]');
  if (!card) return false;

  const text = card.textContent ?? "";
  const placeholder =
    card.querySelector<HTMLTextAreaElement>("textarea.proto-agentic-query")
      ?.placeholder ?? "";
  const hasAskPrompt =
    /ask boots sitepilot/i.test(text) || /ask boots sitepilot/i.test(placeholder);

  return hasAskPrompt && /next dialog options/i.test(text);
}

/** Composer card — fixed in summary after setup. */
export function findSitePilotChatComposerCard(): HTMLElement | null {
  const screen = document.querySelector<HTMLElement>(
    ".studio-viewport > div > div:nth-child(10)"
  );
  if (!screen) return null;

  const inPlace = findInPlaceComposer(screen);
  if (inPlace) {
    const card =
      inPlace.querySelector<HTMLElement>('[data-name="component.co.order.summary"]') ??
      inPlace;
    return card;
  }

  const portaled = document.querySelector<HTMLElement>(
    `.${DOCK_CLASS}.${DOCK_PORTAL_CLASS} [data-name="component.co.order.summary"]`
  );
  if (portaled && isSitePilotChatComposerFrame(portaled)) {
    return portaled;
  }

  const summary = getChatSummary(screen);
  return findSummaryComposer(summary ?? screen) ?? null;
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

/** Hide composer while availability / other overlays are open. */
export function setSitePilotChatComposerDockSuppressed(suppressed: boolean): void {
  document.body.toggleAttribute("data-studio-chat-composer-suppressed", suppressed);
  applyComposerDockSuppressed();
}

/** Mount / sync the fixed composer dock — same path for CJM on and browse. */
export function mountSitePilotChatComposerDock(screen: HTMLElement): void {
  if (isChatReactMounted()) return;
  ensureSitePilotChatComposerDock(screen);
  syncSitePilotChatComposerDock(screen);
  applyComposerDockSuppressed(screen);
  requestAnimationFrame(() => {
    syncSitePilotChatComposerDock(screen);
    applyComposerDockSuppressed(screen);
  });
}

/** Idempotent — safe before scenario frame collection. */
export function ensureSitePilotChatComposerDock(screen: HTMLElement): void {
  if (isChatReactMounted()) return;
  const summary = getChatSummary(screen);
  const paddingDiv = summary?.parentElement ?? null;
  const composer = summary ? findInPlaceComposer(screen) : null;

  if (
    composer?.isConnected &&
    summary &&
    composer.classList.contains(COMPOSER_CARD_CLASS)
  ) {
    if (paddingDiv) {
      const disclaimer = findChatDisclaimer(paddingDiv);
      if (disclaimer && !disclaimer.classList.contains(DISCLAIMER_CLASS)) {
        disclaimer.classList.add(DISCLAIMER_CLASS);
        disclaimerByScreen.set(screen, disclaimer);
      }
    }
    clearComposerScenarioStyles(composer);
    syncInPlaceGeometry(screen, summary, composer);
    requestAnimationFrame(() => syncInPlaceGeometry(screen, summary, composer));
    return;
  }

  dockCleanupByScreen.get(screen)?.();
  dockCleanupByScreen.set(screen, setupSitePilotChatComposerDock(screen));
}

/** Re-align dock after chat layout / scenario frame changes. */
export function syncSitePilotChatComposerDock(screen: HTMLElement): void {
  const summary = getChatSummary(screen);
  const composer = findInPlaceComposer(screen);
  if (composer && summary) {
    clearComposerScenarioStyles(composer);
    syncInPlaceGeometry(screen, summary, composer);
    applyComposerDockSuppressed(screen);
    return;
  }
  ensureSitePilotChatComposerDock(screen);
}

export function teardownSitePilotChatComposerDock(screen: HTMLElement): void {
  disclaimerByScreen.delete(screen);
  dockCleanupByScreen.get(screen)?.();
  dockCleanupByScreen.delete(screen);
}

/** In-place fixed bottom — composer stays in React tree (CJM frame steps won't delete it). */
export function setupSitePilotChatComposerDock(
  screen: HTMLElement
): () => void {
  const body = screen.querySelector<HTMLElement>('[data-name="body"]');
  const summary = body?.querySelector<HTMLElement>(
    '[data-name="component.appointment.summary"]'
  );
  const paddingDiv = summary?.parentElement ?? null;
  const scrollHost = getScrollHost();
  if (!summary || !paddingDiv) return () => {};

  restoreChatDom(summary, paddingDiv);

  const composer = findSummaryComposer(summary);
  if (!composer) return () => {};

  clearComposerScenarioStyles(composer);
  composer.dataset.studioChatComposer = "true";
  composer.classList.add(COMPOSER_CARD_CLASS, DOCK_IN_PLACE_CLASS);
  screen.classList.add("proto-chat-screen");

  const disclaimer = findChatDisclaimer(paddingDiv);
  if (disclaimer) {
    disclaimer.classList.add(DISCLAIMER_CLASS);
    disclaimerByScreen.set(screen, disclaimer);
  } else {
    disclaimerByScreen.delete(screen);
  }

  const onReposition = () => syncInPlaceGeometry(screen, summary, composer);

  const ro = new ResizeObserver(onReposition);
  ro.observe(composer);
  ro.observe(summary);
  if (disclaimer) ro.observe(disclaimer);
  scrollHost?.addEventListener("scroll", onReposition, { passive: true });
  window.addEventListener("resize", onReposition);
  window.addEventListener("scroll", onReposition, { passive: true });
  onReposition();
  requestAnimationFrame(() => {
    onReposition();
    requestAnimationFrame(onReposition);
  });

  syncSitePilotChatFeedbackFrame(screen);

  return () => {
    ro.disconnect();
    scrollHost?.removeEventListener("scroll", onReposition);
    window.removeEventListener("resize", onReposition);
    window.removeEventListener("scroll", onReposition);
    screen.classList.remove("proto-chat-screen");
    screen.style.removeProperty(COMPOSER_PAD_VAR);
    disclaimerByScreen.delete(screen);
    restoreChatDom(summary, paddingDiv);
  };
}

export function collectSitePilotChatScenarioFrames(
  screen: ParentNode
): HTMLElement[] {
  const summary = getChatSummary(screen);
  if (!summary) return [];

  return Array.from(summary.children).filter(
    (node): node is HTMLElement =>
      node instanceof HTMLElement &&
      !isSitePilotChatComposerFrame(node) &&
      !node.classList.contains(COMPOSER_CARD_CLASS) &&
      !node.hasAttribute("data-studio-chat-thinking") &&
      !isSitePilotChatFeedbackFrame(node)
  );
}

export function isSitePilotChatAgentReplyFrame(frame: HTMLElement): boolean {
  return frame.matches('[data-name="reply"]');
}

export function isSitePilotChatFeedbackFrame(frame: HTMLElement): boolean {
  return /was this conversation helpful/i.test(frame.textContent ?? "");
}

export const SITE_PILOT_CHAT_PLAYBACK_THINK_MS = 1400;

export const SITE_PILOT_CHAT_FINALE_CTA = /choose different date/i;

export function syncSitePilotChatFeedbackFrame(screen: ParentNode): void {
  const summary = getChatSummary(screen);
  if (!summary) return;

  Array.from(summary.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    if (!isSitePilotChatFeedbackFrame(child)) return;
    child.classList.add("proto-chat-feedback-frame");
    child.hidden = true;
  });
}
