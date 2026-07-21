import { createRoot, type Root } from "react-dom/client";
import { PlpScreen, type PlpScreenProps } from "./PlpScreen";
import { PLP_REACT_SCREEN_ID, PLP_SCREEN_SELECTOR } from "./plpContract";
import {
  restoreMakeUnderPage,
  retireMakeUnderPage,
} from "../retireMakeUnderPage";

const HOST_CLASS = "studio-react-screen-host";
/** Keep Studio chrome mounts; retire every Make Frame child under PLP. */
const KEEP_VISIBLE = new Set([HOST_CLASS, "proto-footer-mount", "proto-header-mount"]);

let root: Root | null = null;
let hostEl: HTMLElement | null = null;
/** Cancels a deferred unmount when remount wins the race (tab flip / Strict Mode). */
let unmountTimer: ReturnType<typeof setTimeout> | null = null;

function pageEl(): HTMLElement | null {
  return document.querySelector(PLP_SCREEN_SELECTOR);
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
    host.dataset.studioReactScreen = PLP_REACT_SCREEN_ID;
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
  retireMakeUnderPage(page, PLP_REACT_SCREEN_ID, {
    keepClassNames: KEEP_VISIBLE,
  });
}

function restoreMakeChrome(page: HTMLElement): void {
  restoreMakeUnderPage(page, PLP_REACT_SCREEN_ID);
}

/** True when PLP Make wire has been retired for the React migration. */
export function isPlpReactMounted(): boolean {
  return !!pageEl()?.dataset.studioReactScreen;
}

export function mountPlpScreen(props: PlpScreenProps): void {
  cancelDeferredUnmount();
  const page = pageEl();
  if (!page) return;

  hideMakeChrome(page);
  const host = ensureHost(page);
  if (!root) root = createRoot(host);
  root.render(<PlpScreen {...props} />);
}

/**
 * Tear down the createRoot host. Must not call `root.unmount()` synchronously
 * during a parent React render/commit (useLayoutEffect) — defer to macrotask.
 */
export function unmountPlpScreen(): void {
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
