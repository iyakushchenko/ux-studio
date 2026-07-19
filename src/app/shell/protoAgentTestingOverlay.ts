/**
 * Compact bottom-right agent-testing status panel.
 * Invisible full-viewport capture blocks page clicks; page stays visible.
 *
 *   window.__protoAgentTestingOverlay?.start()
 *   window.__protoAgentTestingOverlay?.touch() // arm if inactive (no nest bump)
 *   window.__protoAgentTestingOverlay?.log("clicked Book Step 2")
 *   window.__protoAgentTestingOverlay?.stop() // nest-aware → DONE settle ~5s; no reload
 *   window.__protoAgentTestingOverlay?.stop({ force: true, reload: true })
 *
 * MCP helpers should call stop({ reload: true }) so the PO gets a clean tab
 * after the sitrep settle window (reload runs after settle, not instantly).
 * Manual console experiments default to reload: false.
 * Ephemeral `?proof=*` (and friends) are stripped on install + stop.
 */

import { stripEphemeralStudioQuery } from "@/app/shell/protoStudioUrl";

const ROOT_ID = "proto-agent-testing-overlay";
const LOG_LIMIT = 80;
/** Safety: never leave the overlay up longer than this. */
const MAX_MS = 3 * 60 * 1000;
/** Default DONE/SITREP settle before hide (and optional reload). */
export const DEFAULT_SETTLE_MS = 5000;
const SETTLE_MS_MIN = 4000;
const SETTLE_MS_MAX = 6000;
/** Stale persist key — cleared on stop; never restored on load by default. */
const PERSIST_KEY = "protoAgentTestingOverlay";
const CONTINUE_KEY = "protoAgentTestingOverlayContinue";
const HISTORY_KEY = "protoAgentTestingOverlayHistory";
const HISTORY_MAX = 5;
const HISTORY_LINE_CAP = 12;

export type StopAgentTestingOverlayOptions = {
  force?: boolean;
  /** After settle (or force teardown), reload once. MCP helpers: true. Manual: false. */
  reload?: boolean;
  /**
   * DONE/SITREP visible duration before hide (ms).
   * Default 5000; clamped to 4000–6000. Ignored when `force: true`.
   */
  settleMs?: number;
};

type OverlayApi = {
  start: (title?: string) => void;
  /** Arm overlay if inactive; refresh safety timer if already active. Never nests. */
  touch: (title?: string) => void;
  stop: (options?: StopAgentTestingOverlayOptions) => void;
  log: (line: string) => void;
  isActive: () => boolean;
};

type HistoryEntry = {
  title: string;
  endedAt: number;
  lines: string[];
};

let active = false;
let settling = false;
let logLines: string[] = [];
let sessionTitle = "AGENT TESTING";
let nest = 0;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
let settleTimer: ReturnType<typeof setTimeout> | null = null;
let beforeUnloadBound = false;
let reloadPending = false;
let settleReload = false;

function clearPersist(): void {
  try {
    sessionStorage.removeItem(PERSIST_KEY);
  } catch {
    /* private mode / SSR */
  }
}

function writePersist(title: string): void {
  try {
    sessionStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({ title, at: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

function shouldContinueFromPersist(): boolean {
  try {
    return sessionStorage.getItem(CONTINUE_KEY) === "1";
  } catch {
    return false;
  }
}

function readHistory(): HistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        !!e &&
        typeof e === "object" &&
        typeof (e as HistoryEntry).title === "string" &&
        typeof (e as HistoryEntry).endedAt === "number" &&
        Array.isArray((e as HistoryEntry).lines)
    );
  } catch {
    return [];
  }
}

function pushHistory(entry: HistoryEntry): HistoryEntry[] {
  const next = [entry, ...readHistory()].slice(0, HISTORY_MAX);
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

function clearSafetyTimer(): void {
  if (safetyTimer != null) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }
}

function clearSettleTimer(): void {
  if (settleTimer != null) {
    clearTimeout(settleTimer);
    settleTimer = null;
  }
}

function armSafetyTimer(): void {
  clearSafetyTimer();
  safetyTimer = setTimeout(() => {
    logAgentTestingOverlay("overlay auto-stop: safety timeout");
    stopAgentTestingOverlay({ force: true, reload: false });
  }, MAX_MS);
}

function clampSettleMs(ms?: number): number {
  const n = typeof ms === "number" && Number.isFinite(ms) ? ms : DEFAULT_SETTLE_MS;
  return Math.min(SETTLE_MS_MAX, Math.max(SETTLE_MS_MIN, Math.round(n)));
}

function onBeforeUnload(): void {
  if (!active && !settling) return;
  nest = 0;
  active = false;
  settling = false;
  settleReload = false;
  clearSafetyTimer();
  clearSettleTimer();
  clearPersist();
}

function bindBeforeUnload(): void {
  if (beforeUnloadBound || typeof window === "undefined") return;
  if (typeof window.addEventListener !== "function") return;
  window.addEventListener("beforeunload", onBeforeUnload);
  beforeUnloadBound = true;
}

function unbindBeforeUnload(): void {
  if (!beforeUnloadBound || typeof window === "undefined") return;
  if (typeof window.removeEventListener === "function") {
    window.removeEventListener("beforeunload", onBeforeUnload);
  }
  beforeUnloadBound = false;
}

function setHint(text: string): void {
  if (typeof document === "undefined") return;
  const el = document.querySelector<HTMLElement>(
    ".proto-agent-testing-overlay__hint"
  );
  if (el) el.textContent = text;
}

function renderHistory(entries: HistoryEntry[]): void {
  if (typeof document === "undefined") return;
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  let box = root.querySelector<HTMLElement>(
    ".proto-agent-testing-overlay__history"
  );
  const prior = entries.slice(1, HISTORY_MAX); // skip the just-pushed current
  if (prior.length === 0) {
    box?.remove();
    return;
  }
  if (!box) {
    box = document.createElement("div");
    box.className = "proto-agent-testing-overlay__history";
    const panel = root.querySelector(".proto-agent-testing-overlay__panel");
    panel?.appendChild(box);
  }
  box.replaceChildren();
  const label = document.createElement("p");
  label.className = "proto-agent-testing-overlay__history-label";
  label.textContent = "Recent";
  box.appendChild(label);
  const list = document.createElement("ul");
  for (const entry of prior.slice(0, 4)) {
    const li = document.createElement("li");
    const when = new Date(entry.endedAt).toLocaleTimeString("en-GB", {
      hour12: false,
    });
    li.textContent = `${when}  ${entry.title}`;
    list.appendChild(li);
  }
  box.appendChild(list);
}

function ensureRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (typeof document.getElementById !== "function") return null;
  let root = document.getElementById(ROOT_ID);
  if (root) return root;

  root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = "proto-agent-testing-overlay";
  root.setAttribute("aria-live", "polite");
  root.innerHTML = `
    <div class="proto-agent-testing-overlay__capture" aria-hidden="true"></div>
    <div class="proto-agent-testing-overlay__panel" role="status">
      <div class="proto-agent-testing-overlay__header">
        <p class="proto-agent-testing-overlay__title">AGENT TESTING</p>
        <button type="button" class="proto-agent-testing-overlay__dismiss">Dismiss</button>
      </div>
      <p class="proto-agent-testing-overlay__hint">Page visible — clicks blocked. Status log below.</p>
      <ol class="proto-agent-testing-overlay__log"></ol>
    </div>
  `;
  const dismiss = root.querySelector<HTMLButtonElement>(
    ".proto-agent-testing-overlay__dismiss"
  );
  dismiss?.addEventListener("click", () => {
    stopAgentTestingOverlay({ force: true, reload: false });
  });
  document.documentElement.appendChild(root);
  return root;
}

function renderLog(): void {
  if (typeof document === "undefined") return;
  if (typeof document.getElementById !== "function") return;
  const root = document.getElementById(ROOT_ID);
  const list = root?.querySelector<HTMLOListElement>(
    ".proto-agent-testing-overlay__log"
  );
  if (!list) return;
  list.replaceChildren();
  for (const line of logLines) {
    const li = document.createElement("li");
    li.textContent = line;
    list.appendChild(li);
  }
  list.scrollTop = list.scrollHeight;
}

function setTitle(title: string): void {
  if (typeof document === "undefined") return;
  const el = document.querySelector<HTMLElement>(
    ".proto-agent-testing-overlay__title"
  );
  if (el) el.textContent = title;
}

function stamp(line: string): string {
  const t = new Date().toLocaleTimeString("en-GB", { hour12: false });
  return `${t}  ${line}`;
}

function releaseClickGuard(): void {
  if (typeof document === "undefined") return;
  delete document.documentElement.dataset.protoAgentTesting;
}

function teardownDom(): void {
  if (typeof document === "undefined") return;
  if (typeof document.getElementById !== "function") return;
  const root = document.getElementById(ROOT_ID);
  if (root) {
    root.dataset.active = "false";
    root.dataset.settling = "false";
    root.querySelector(".proto-agent-testing-overlay__history")?.remove();
  }
  delete document.documentElement.dataset.protoAgentTesting;
}

function scheduleReload(delayMs = 120): void {
  if (reloadPending || typeof window === "undefined") return;
  reloadPending = true;
  // Defer so MCP evaluate_script can return the run result before navigation.
  window.setTimeout(() => {
    window.location.reload();
  }, delayMs);
}

function finishSettle(): void {
  settling = false;
  clearSettleTimer();
  teardownDom();
  stripEphemeralStudioQuery();
  unbindBeforeUnload();
  if (settleReload) {
    settleReload = false;
    scheduleReload(120);
  }
}

function cancelSettle(instantReload?: boolean): void {
  const wantReload = settleReload || !!instantReload;
  settleReload = false;
  settling = false;
  clearSettleTimer();
  teardownDom();
  if (wantReload) scheduleReload(120);
}

function enterSettle(options?: StopAgentTestingOverlayOptions): void {
  const settleMs = clampSettleMs(options?.settleMs);
  settleReload = !!options?.reload;
  settling = true;
  active = false;
  clearSafetyTimer();
  clearPersist();

  const root = ensureRoot();
  if (root) {
    root.dataset.active = "false";
    root.dataset.settling = "true";
  }
  // Release pointer block so PO can use the page while reading sitrep.
  releaseClickGuard();

  setTitle("AGENT DONE — SITREP");
  setHint(
    settleReload
      ? `Sitrep — page usable. Reload in ~${Math.round(settleMs / 1000)}s.`
      : `Sitrep — page usable. Clears in ~${Math.round(settleMs / 1000)}s.`
  );
  renderLog();

  const history = pushHistory({
    title: sessionTitle,
    endedAt: Date.now(),
    lines: logLines.slice(-HISTORY_LINE_CAP),
  });
  renderHistory(history);

  clearSettleTimer();
  settleTimer = setTimeout(() => {
    finishSettle();
  }, settleMs);
}

export function startAgentTestingOverlay(title?: string): void {
  if (settling) {
    cancelSettle(false);
  }
  nest += 1;
  active = true;
  settling = false;
  const resolved = title?.trim() || "AGENT TESTING";
  sessionTitle = resolved;
  const root = ensureRoot();
  if (root) {
    root.dataset.active = "true";
    root.dataset.settling = "false";
    root.querySelector(".proto-agent-testing-overlay__history")?.remove();
  }
  if (typeof document !== "undefined") {
    document.documentElement.dataset.protoAgentTesting = "true";
  }
  setTitle(resolved);
  setHint("Page visible — clicks blocked. Status log below.");
  writePersist(resolved);
  bindBeforeUnload();
  armSafetyTimer();
  if (nest === 1) {
    logLines = [];
    logAgentTestingOverlay("overlay start");
  }
}

export function stopAgentTestingOverlay(
  options?: StopAgentTestingOverlayOptions
): void {
  if (options?.force) {
    nest = 0;
    if (active) logAgentTestingOverlay("overlay stop");
    active = false;
    clearSafetyTimer();
    clearPersist();
    stripEphemeralStudioQuery();
    // Instant dismiss — skip sitrep settle.
    if (settling) {
      cancelSettle(!!options.reload);
      return;
    }
    unbindBeforeUnload();
    teardownDom();
    if (options.reload) scheduleReload(120);
    return;
  }

  nest = Math.max(0, nest - 1);
  if (nest > 0) return;
  if (settling) {
    // Already in sitrep; honor a late reload request.
    if (options?.reload) settleReload = true;
    return;
  }
  if (!active) {
    if (options?.reload) scheduleReload(120);
    return;
  }

  logAgentTestingOverlay("overlay stop");
  enterSettle(options);
}

/**
 * Ensure the BR panel is visible while an agent drives the tab.
 * Safe to call on every helper / DevTools evaluate — does not bump nest.
 */
export function touchAgentTestingOverlay(title?: string): void {
  if (settling) {
    cancelSettle(false);
  }
  if (active) {
    armSafetyTimer();
    if (title?.trim()) {
      sessionTitle = title.trim();
      setTitle(sessionTitle);
    }
    return;
  }
  startAgentTestingOverlay(title);
}

export function logAgentTestingOverlay(line: string): void {
  if (!active) return;
  logLines.push(stamp(line));
  if (logLines.length > LOG_LIMIT) {
    logLines = logLines.slice(-LOG_LIMIT);
  }
  renderLog();
}

export function isAgentTestingOverlayActive(): boolean {
  return active;
}

export function isAgentTestingOverlaySettling(): boolean {
  return settling;
}

/**
 * On install: never restore a stale "testing" flag unless an explicit
 * continue key is set (default: never). Clear orphan persist otherwise.
 */
export function installAgentTestingOverlayApi(): void {
  if (typeof window === "undefined") return;

  stripEphemeralStudioQuery();

  if (!shouldContinueFromPersist()) {
    clearPersist();
    // Orphan DOM from a hard refresh / HMR — do not leave it active.
    if (
      typeof document !== "undefined" &&
      typeof document.getElementById === "function"
    ) {
      const orphan = document.getElementById(ROOT_ID);
      if (orphan) {
        orphan.dataset.active = "false";
        orphan.dataset.settling = "false";
        delete document.documentElement.dataset.protoAgentTesting;
      }
    }
    nest = 0;
    active = false;
    settling = false;
    settleReload = false;
    clearSettleTimer();
  }

  const api: OverlayApi = {
    start: startAgentTestingOverlay,
    touch: touchAgentTestingOverlay,
    stop: (options) => stopAgentTestingOverlay(options),
    log: logAgentTestingOverlay,
    isActive: isAgentTestingOverlayActive,
  };
  window.__protoAgentTestingOverlay = api;
}

export function uninstallAgentTestingOverlayApi(): void {
  nest = 0;
  active = false;
  settling = false;
  settleReload = false;
  logLines = [];
  reloadPending = false;
  clearSafetyTimer();
  clearSettleTimer();
  clearPersist();
  unbindBeforeUnload();
  if (typeof document !== "undefined") {
    if (typeof document.getElementById === "function") {
      document.getElementById(ROOT_ID)?.remove();
    }
    delete document.documentElement.dataset.protoAgentTesting;
  }
  if (typeof window !== "undefined") {
    delete window.__protoAgentTestingOverlay;
  }
}

declare global {
  interface Window {
    __protoAgentTestingOverlay?: OverlayApi;
  }
}
