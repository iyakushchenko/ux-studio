import { createRoot, type Root } from "react-dom/client";
import { noteReactScreenHostEnter } from "@/app/shell/screenHostDiag";
import {
  BookStep3ConfirmationScreen,
  type BookStep3ConfirmationScreenProps,
} from "./BookStep3ConfirmationScreen";
import {
  BOOK_STEP3_REACT_SCREEN_ID,
  BOOK_STEP3_SCREEN_SELECTOR,
} from "./bookStep3Contract";
import { retireLegacyUnderPage } from "../retireLegacyUnderPage";

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
/** mountBookStep3Screen invocations (prop re-renders included). */
let renderCount = 0;

function pageEl(): HTMLElement | null {
  return document.querySelector(BOOK_STEP3_SCREEN_SELECTOR);
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
    host.dataset.studioReactScreen = BOOK_STEP3_REACT_SCREEN_ID;
    const footer = page.querySelector<HTMLElement>(
      ":scope > .proto-footer-mount"
    );
    if (footer) page.insertBefore(host, footer);
    else page.appendChild(host);
  }
  hostEl = host;
  return host;
}

/**
 * Erase-Legacy DONE (board #8): delete Book Step 3's Legacy chrome outright on
 * first mount — no restore path back to Legacy for this screen.
 */
function hideMakeChrome(page: HTMLElement): void {
  retireLegacyUnderPage(page, BOOK_STEP3_REACT_SCREEN_ID, {
    hideSelectors: HIDE_SELECTORS,
    permanent: true,
  });
}

/** True when Book Step 3 Legacy wire has been retired for the React pilot. */
export function isBookStep3ReactMounted(): boolean {
  return !!pageEl()?.dataset.studioReactScreen;
}

export function mountBookStep3Screen(
  props: BookStep3ConfirmationScreenProps
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
  renderCount += 1;
  root.render(<BookStep3ConfirmationScreen {...props} />);
  noteReactScreenHostEnter({
    screenId: BOOK_STEP3_REACT_SCREEN_ID,
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
export function unmountBookStep3Screen(): void {
  if (unmountTimer != null) return;
  if (!root && !hostEl) return;

  const page = pageEl();
  // Gate Legacy wire immediately; actual createRoot.unmount runs after commit.
  if (page) delete page.dataset.studioReactScreen;

  unmountTimer = setTimeout(() => {
    unmountTimer = null;
    const r = root;
    const h = hostEl;
    root = null;
    hostEl = null;
    r?.unmount();
    h?.remove();
  }, 0);
}

/** Test / diag helper — remount cycles since page load. */
export function getBookStep3RemountCount(): number {
  return remountCount;
}
