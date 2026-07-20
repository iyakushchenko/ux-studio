import { createRoot, type Root } from "react-dom/client";
import { noteReactScreenHostEnter } from "@/app/shell/screenHostDiag";
import { getPrototypeScrollRoot, scrollCameraToOrigin } from "@/app/scenario/playbackScroll";
import {
  BookStep2DateTimeScreen,
  type BookStep2DateTimeScreenProps,
} from "./BookStep2DateTimeScreen";
import {
  BOOK_STEP2_REACT_SCREEN_ID,
  BOOK_STEP2_SCREEN_SELECTOR,
} from "./bookStep2Contract";

const HOST_CLASS = "studio-react-screen-host";
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
/** createRoot cycles (true remounts). */
let remountCount = 0;
/** mountBookStep2Screen invocations (prop re-renders included). */
let renderCount = 0;

function pageEl(): HTMLElement | null {
  return document.querySelector(BOOK_STEP2_SCREEN_SELECTOR);
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
    host.dataset.studioReactScreen = BOOK_STEP2_REACT_SCREEN_ID;
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
  for (const selector of HIDE_SELECTORS) {
    page.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      if (el.classList.contains(HOST_CLASS)) return;
      if (el.dataset.studioReactScreen === BOOK_STEP2_REACT_SCREEN_ID) return;
      el.style.display = "none";
      el.dataset.studioMakeRetired = BOOK_STEP2_REACT_SCREEN_ID;
    });
  }
  page.dataset.studioReactScreen = BOOK_STEP2_REACT_SCREEN_ID;
}

function restoreMakeChrome(page: HTMLElement): void {
  page
    .querySelectorAll<HTMLElement>(
      `[data-studio-make-retired="${BOOK_STEP2_REACT_SCREEN_ID}"]`
    )
    .forEach((el) => {
      el.style.removeProperty("display");
      delete el.dataset.studioMakeRetired;
    });
  delete page.dataset.studioReactScreen;
}

/** True when Book Step 2 Make wire has been retired for the React pilot. */
export function isBookStep2ReactMounted(): boolean {
  return !!pageEl()?.dataset.studioReactScreen;
}

export function mountBookStep2Screen(
  props: BookStep2DateTimeScreenProps
): void {
  cancelDeferredUnmount();
  const page = pageEl();
  if (!page) return;

  hideMakeChrome(page);
  const host = ensureHost(page);
  const createdRoot = !root;
  if (!root) {
    root = createRoot(host);
    remountCount += 1;
  }
  // Pre-position shared prototype scroll before first paint — chat leave leaves
  // scroll deep; landing date-section snap otherwise page-jiggle deltaY≫100.
  if (createdRoot) {
    const scrollEl = getPrototypeScrollRoot(page);
    if (scrollEl) scrollCameraToOrigin(scrollEl, { instant: true });
  }
  renderCount += 1;
  root.render(<BookStep2DateTimeScreen {...props} />);
  noteReactScreenHostEnter({
    screenId: BOOK_STEP2_REACT_SCREEN_ID,
    host,
    remountCount,
    renderCount,
    createdRoot,
  });
}

/**
 * Tear down the createRoot host. Must not call `root.unmount()` synchronously
 * during a parent React render/commit (useLayoutEffect) — defer to macrotask.
 */
export function unmountBookStep2Screen(): void {
  if (unmountTimer != null) return;
  if (!root && !hostEl) {
    const page = pageEl();
    if (page) restoreMakeChrome(page);
    return;
  }

  const page = pageEl();
  // Gate Make wire immediately; actual createRoot.unmount runs after commit.
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

/** Test / diag helper — remount cycles since page load. */
export function getBookStep2RemountCount(): number {
  return remountCount;
}
