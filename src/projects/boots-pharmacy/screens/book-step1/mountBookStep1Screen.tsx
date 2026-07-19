import { createRoot, type Root } from "react-dom/client";
import {
  BookStep1LocationScreen,
  type BookStep1LocationScreenProps,
} from "./BookStep1LocationScreen";
import {
  BOOK_STEP1_REACT_SCREEN_ID,
  BOOK_STEP1_SCREEN_SELECTOR,
} from "./bookStep1Contract";

const HOST_CLASS = "proto-react-screen-host";
const HIDE_SELECTORS = [
  ':scope > [data-name="boots-pharmacy.module.header"]',
  ':scope > [data-name="module.breadcrumbs"]',
  ':scope > [data-name="body"]',
  ':scope > [data-name="module.footer"]',
] as const;

let root: Root | null = null;
let hostEl: HTMLElement | null = null;
/** Cancels a deferred unmount when remount wins the race (tab flip / Strict Mode). */
let unmountTimer: ReturnType<typeof setTimeout> | null = null;

function pageEl(): HTMLElement | null {
  return document.querySelector(BOOK_STEP1_SCREEN_SELECTOR);
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
    host.dataset.protoReactScreen = BOOK_STEP1_REACT_SCREEN_ID;
    // Keep footer mount last (margin-top:auto sticky footer).
    const footer = page.querySelector<HTMLElement>(":scope > .proto-footer-mount");
    if (footer) page.insertBefore(host, footer);
    else page.appendChild(host);
  }
  hostEl = host;
  return host;
}

function hideMakeChrome(page: HTMLElement): void {
  for (const selector of HIDE_SELECTORS) {
    page.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      if (el.classList.contains(HOST_CLASS)) return;
      if (el.dataset.protoReactScreen === BOOK_STEP1_REACT_SCREEN_ID) return;
      el.style.display = "none";
      el.dataset.protoMakeRetired = BOOK_STEP1_REACT_SCREEN_ID;
    });
  }
  page.dataset.protoReactScreen = BOOK_STEP1_REACT_SCREEN_ID;
}

function restoreMakeChrome(page: HTMLElement): void {
  page
    .querySelectorAll<HTMLElement>(
      `[data-proto-make-retired="${BOOK_STEP1_REACT_SCREEN_ID}"]`
    )
    .forEach((el) => {
      el.style.removeProperty("display");
      delete el.dataset.protoMakeRetired;
    });
  delete page.dataset.protoReactScreen;
}

/** True when Book Step 1 Make wire has been retired for the React pilot. */
export function isBookStep1ReactMounted(): boolean {
  return !!pageEl()?.dataset.protoReactScreen;
}

export function mountBookStep1Screen(props: BookStep1LocationScreenProps): void {
  cancelDeferredUnmount();
  const page = pageEl();
  if (!page) return;

  hideMakeChrome(page);
  const host = ensureHost(page);
  if (!root) root = createRoot(host);
  root.render(<BookStep1LocationScreen {...props} />);
}

/**
 * Tear down the createRoot host. Must not call `root.unmount()` synchronously
 * during a parent React render/commit (useLayoutEffect) — defer to macrotask.
 */
export function unmountBookStep1Screen(): void {
  if (unmountTimer != null) return;
  if (!root && !hostEl) {
    const page = pageEl();
    if (page) restoreMakeChrome(page);
    return;
  }

  const page = pageEl();
  // Gate Make wire immediately; actual createRoot.unmount runs after commit.
  if (page) delete page.dataset.protoReactScreen;

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
