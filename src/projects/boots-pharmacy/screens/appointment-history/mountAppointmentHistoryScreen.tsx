import { createRoot, type Root } from "react-dom/client";
import {
  AppointmentHistoryScreen,
  type AppointmentHistoryScreenProps,
} from "./AppointmentHistoryScreen";
import {
  APPOINTMENT_HISTORY_REACT_SCREEN_ID,
  APPOINTMENT_HISTORY_SCREEN_SELECTOR,
} from "./appointmentHistoryContract";
import { retireLegacyUnderPage } from "../retireLegacyUnderPage";

const HOST_CLASS = "studio-react-screen-host";
/** Keep Studio chrome mounts; retire every Legacy Frame child under History. */
const KEEP_VISIBLE = new Set([HOST_CLASS, "proto-footer-mount", "proto-header-mount"]);

let root: Root | null = null;
let hostEl: HTMLElement | null = null;
/** Cancels a deferred unmount when remount wins the race (tab flip / Strict Mode). */
let unmountTimer: ReturnType<typeof setTimeout> | null = null;

function pageEl(): HTMLElement | null {
  return document.querySelector(APPOINTMENT_HISTORY_SCREEN_SELECTOR);
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
    host.dataset.studioReactScreen = APPOINTMENT_HISTORY_REACT_SCREEN_ID;
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
 * Erase-Legacy Phase E (board #7c tail / substrate replacement): `ProjectPageShell`
 * columns start empty — there is no Frame219-sourced Legacy content left to
 * park-and-restore. Retire permanently, matching the Book Step 1-3 precedent.
 */
function hideMakeChrome(page: HTMLElement): void {
  retireLegacyUnderPage(page, APPOINTMENT_HISTORY_REACT_SCREEN_ID, {
    keepClassNames: KEEP_VISIBLE,
    permanent: true,
  });
}

/** True when Appointment History Legacy wire has been retired for the React migration. */
export function isAppointmentHistoryReactMounted(): boolean {
  return !!pageEl()?.dataset.studioReactScreen;
}

export function mountAppointmentHistoryScreen(
  props: AppointmentHistoryScreenProps
): void {
  cancelDeferredUnmount();
  const page = pageEl();
  if (!page) return;

  hideMakeChrome(page);
  page.dataset.studioReactScreen = APPOINTMENT_HISTORY_REACT_SCREEN_ID;
  const host = ensureHost(page);
  if (!root) root = createRoot(host);
  root.render(<AppointmentHistoryScreen {...props} />);
}

/**
 * Tear down the createRoot host. Must not call `root.unmount()` synchronously
 * during a parent React render/commit (useLayoutEffect) — defer to macrotask.
 */
export function unmountAppointmentHistoryScreen(): void {
  if (unmountTimer != null) return;
  if (!root && !hostEl) return;

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
  }, 0);
}
