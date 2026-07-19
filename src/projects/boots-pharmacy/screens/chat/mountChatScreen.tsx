import { useEffect, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ChatScreen, type ChatScreenProps } from "./ChatScreen";
import {
  CHAT_CHILD_INDEX,
  CHAT_REACT_MOUNT_ENABLED,
  CHAT_REACT_SCREEN_ID,
  CHAT_SCREEN_SELECTOR,
} from "./chatContract";

const HOST_CLASS = "studio-react-screen-host";
/** Keep Studio chrome mounts; retire every Make Frame child under Chat. */
const KEEP_VISIBLE = new Set([HOST_CLASS, "proto-footer-mount", "proto-header-mount"]);

let root: Root | null = null;
let hostEl: HTMLElement | null = null;
let unmountTimer: ReturnType<typeof setTimeout> | null = null;

function pageEl(): HTMLElement | null {
  return document.querySelector(CHAT_SCREEN_SELECTOR);
}

function cancelDeferredUnmount(): void {
  if (unmountTimer != null) {
    clearTimeout(unmountTimer);
    unmountTimer = null;
  }
}

function ensureHost(page: HTMLElement): HTMLElement {
  let host = page.querySelector<HTMLElement>(`:scope > .${HOST_CLASS}`);
  if (!host) {
    host = document.createElement("div");
    host.className = HOST_CLASS;
    host.dataset.studioReactScreen = CHAT_REACT_SCREEN_ID;
    const footer = page.querySelector<HTMLElement>(
      ":scope > .proto-footer-mount"
    );
    if (footer) page.insertBefore(host, footer);
    else page.appendChild(host);
  }
  hostEl = host;
  return host;
}

function hideMakeChrome(page: HTMLElement): void {
  Array.from(page.children).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const classList = node.classList;
    if (
      [...KEEP_VISIBLE].some((cls) => classList.contains(cls)) ||
      node.dataset.studioReactScreen === CHAT_REACT_SCREEN_ID
    ) {
      return;
    }
    node.style.display = "none";
    node.dataset.studioMakeRetired = CHAT_REACT_SCREEN_ID;
  });
  page.dataset.studioReactScreen = CHAT_REACT_SCREEN_ID;
}

function restoreMakeChrome(page: HTMLElement): void {
  page
    .querySelectorAll<HTMLElement>(
      `[data-studio-make-retired="${CHAT_REACT_SCREEN_ID}"]`
    )
    .forEach((el) => {
      el.style.removeProperty("display");
      delete el.dataset.studioMakeRetired;
    });
  delete page.dataset.studioReactScreen;
}

/** True when Chat Make wire has been retired for the React migration. */
export function isChatReactMounted(): boolean {
  return !!pageEl()?.dataset.studioReactScreen;
}

export function mountChatScreen(props: ChatScreenProps): void {
  cancelDeferredUnmount();
  const page = pageEl();
  if (!page) return;

  hideMakeChrome(page);
  const host = ensureHost(page);
  if (!root) root = createRoot(host);
  root.render(<ChatScreen {...props} />);
}

export function unmountChatScreen(): void {
  if (unmountTimer != null) return;
  if (!root && !hostEl) {
    const page = pageEl();
    if (page) restoreMakeChrome(page);
    return;
  }

  const page = pageEl();
  if (page) delete page.dataset.studioReactScreen;

  unmountTimer = setTimeout(() => {
    unmountTimer = null;
    const r = root;
    const h = hostEl;
    root = null;
    hostEl = null;
    r?.unmount();
    h?.remove();
    if (page) restoreMakeChrome(page);
  }, 0);
}

/** Wire into BootsPharmacyProjectView — keeps monster file under hygiene ceiling. */
export function useChatScreenMount(activeChildIndex: number | undefined): void {
  useLayoutEffect(() => {
    if (activeChildIndex !== CHAT_CHILD_INDEX) {
      unmountChatScreen();
      return;
    }
    if (!CHAT_REACT_MOUNT_ENABLED) {
      unmountChatScreen();
      return;
    }
    mountChatScreen({});
  }, [activeChildIndex]);

  useEffect(() => () => unmountChatScreen(), []);
}
