/**
 * Compact bottom-right agent-testing status panel.
 * Invisible full-viewport capture blocks page clicks; page stays visible.
 *
 *   window.__studioAgentTestingOverlay?.start()
 *   window.__studioAgentTestingOverlay?.touch() // arm if inactive (no nest bump)
 *   window.__studioAgentTestingOverlay?.log("clicked Book Step 2")
 *   window.__studioAgentTestingOverlay?.stop() // nest-aware → DONE settle ~5s; no reload
 *   window.__studioAgentTestingOverlay?.stop({ force: true, reload: true })
 *   window.__studioAgentTestingOverlay?.forceClear() // always dismiss (Dismiss button)
 *
 * MCP helpers should call stop({ reload: true }) so the PO gets a clean tab
 * after the sitrep settle window (reload runs after settle, not instantly).
 * Manual console experiments default to reload: false.
 * Post-test default: stay on current project+screen (strip ephemeral only).
 * Pass resetToHub: true for CJM/journey hub clean slate.
 *
 * Touch-only / DevTools sessions without stop(): idle auto-stop (~45s) → sitrep,
 * plus hard safety timeout (3 min force clear). Titles stay clean ("AGENT TESTING").
 */
import {
  resetStudioAfterAgentTest,
  stripEphemeralStudioQuery,
} from "@/app/shell/studioUrl";
import { removeDemoCursor } from "@/app/scenario/demoCursor";
const ROOT_ID = "agent-testing-overlay";
const LOG_LIMIT = 80;
/** Safety: never leave the overlay up longer than this (force clear). */
const MAX_MS = 3 * 60 * 1000;
/** Touch-only / abandoned sessions: auto stop → sitrep after idle. */
export const IDLE_MS = 45_000;
/** Default DONE/SITREP settle before hide (and optional reload). */
export const DEFAULT_SETTLE_MS = 5000;
const SETTLE_MS_MIN = 4000;
const SETTLE_MS_MAX = 6000;
const SITREP_COUNTDOWN_TICK_MS = 250;
/** Stale persist key — cleared on stop; never restored on load by default. */
const PERSIST_KEY = "agentTestingOverlay";
const CONTINUE_KEY = "protoAgentTestingOverlayContinue";
const HISTORY_KEY = "protoAgentTestingOverlayHistory";
const HISTORY_MAX = 5;
const HISTORY_LINE_CAP = 12;
const DEFAULT_TITLE = "AGENT TESTING";
const SITREP_TITLE = "AGENT DONE — SITREP";
export type StopAgentTestingOverlayOptions = {
  force?: boolean;
  /** After settle (or force teardown), reload once. MCP helpers: true. Manual: false. */
  reload?: boolean;
  /**
   * When true: force hub after stop/reload (CJM/journey).
   * Default false: stay on current project + screen.
   */
  resetToHub?: boolean;
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
  /** Always clear instantly (Dismiss / stuck recovery). */
  forceClear: () => void;
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
let sessionTitle = DEFAULT_TITLE;
let nest = 0;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let settleTimer: ReturnType<typeof setTimeout> | null = null;
let settleCountdownTimer: ReturnType<typeof setInterval> | null = null;
let beforeUnloadBound = false;
let visibilityBound = false;
let reloadPending = false;
let settleReload = false;
/** Latched for settle + deferred reload (default stay-on-page). */
let settleResetToHub = false;

/**
 * Never show raw `__studio*` / `__proto*` helper names in the title
 * (CSS uppercase turned `__studioEnsureCleanStudio` into garbled STUDIOENSURE…).
 */
export function resolveAgentTestingOverlayTitle(title?: string): string {
  const raw = title?.trim();
  if (!raw) return DEFAULT_TITLE;
  if (/__(?:studio|proto)/i.test(raw)) return DEFAULT_TITLE;
  if (/ensureCleanStudio/i.test(raw)) return DEFAULT_TITLE;
  // Allow short labels like "AGENT TESTING — mcp-sanity"
  if (/^AGENT TESTING\b/i.test(raw) && raw.length <= 48) return raw;
  if (raw.length > 48) return DEFAULT_TITLE;
  return raw;
}

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
function clearIdleTimer(): void {
  if (idleTimer != null) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}
function clearSettleTimer(): void {
  if (settleTimer != null) {
    clearTimeout(settleTimer);
    settleTimer = null;
  }
  if (settleCountdownTimer != null) {
    clearInterval(settleCountdownTimer);
    settleCountdownTimer = null;
  }
}

/** Hide/dismiss robo-cursor when sitrep clears or forceClear. */
function dismissRoboCursor(): void {
  try {
    removeDemoCursor({ immediate: true });
  } catch {
    /* never block overlay teardown */
  }
}

/** Exported for unit tests — live sitrep countdown copy. */
export function formatSitrepHint(secondsLeft: number, reload: boolean): string {
  const s = Math.max(0, secondsLeft);
  return reload
    ? `Done — auto-closes in ${s}s (then reload)`
    : `Done — auto-closes in ${s}s`;
}
function armSafetyTimer(): void {
  clearSafetyTimer();
  safetyTimer = setTimeout(() => {
    try {
      logAgentTestingOverlay("overlay auto-stop: safety timeout");
    } catch {
      /* ignore */
    }
    stopAgentTestingOverlay({ force: true, reload: false });
  }, MAX_MS);
}
function armIdleTimer(): void {
  clearIdleTimer();
  if (!active || settling) return;
  idleTimer = setTimeout(() => {
    if (!active || settling) return;
    try {
      logAgentTestingOverlay("overlay auto-stop: idle timeout");
    } catch {
      /* ignore */
    }
    // Collapse nest so abandoned touch()/helper arms always settle.
    nest = 1;
    stopAgentTestingOverlay({ reload: false });
  }, IDLE_MS);
}
function noteActivity(): void {
  if (!active || settling) return;
  armSafetyTimer();
  armIdleTimer();
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
  clearIdleTimer();
  clearSettleTimer();
  clearPersist();
}
function onVisibilityChange(): void {
  if (typeof document === "undefined") return;
  if (document.visibilityState !== "visible") return;
  // Returning to a stuck tab: if still active, re-arm idle so abandon clears soon.
  if (active && !settling) {
    armIdleTimer();
  }
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
function bindVisibility(): void {
  if (visibilityBound || typeof document === "undefined") return;
  if (typeof document.addEventListener !== "function") return;
  document.addEventListener("visibilitychange", onVisibilityChange);
  visibilityBound = true;
}
function unbindVisibility(): void {
  if (!visibilityBound || typeof document === "undefined") return;
  if (typeof document.removeEventListener === "function") {
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }
  visibilityBound = false;
}
function setHint(text: string): void {
  if (typeof document === "undefined") return;
  const el = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__hint"
  );
  if (el) el.textContent = text;
}
function renderHistory(entries: HistoryEntry[]): void {
  if (typeof document === "undefined") return;
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  let box = root.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__history"
  );
  const prior = entries.slice(1, HISTORY_MAX); // skip the just-pushed current
  if (prior.length === 0) {
    box?.remove();
    return;
  }
  if (!box) {
    box = document.createElement("div");
    box.className = "studio-agent-testing-overlay__history";
    const panel = root.querySelector(".studio-agent-testing-overlay__panel");
    panel?.appendChild(box);
  }
  box.replaceChildren();
  const label = document.createElement("p");
  label.className = "studio-agent-testing-overlay__history-label";
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
  root.className = "studio-agent-testing-overlay";
  root.setAttribute("aria-live", "polite");
  root.innerHTML = `
    <div class="studio-agent-testing-overlay__capture" aria-hidden="true"></div>
    <div class="studio-agent-testing-overlay__panel" role="status">
      <div class="studio-agent-testing-overlay__header">
        <p class="studio-agent-testing-overlay__title">${DEFAULT_TITLE}</p>
        <button type="button" class="studio-agent-testing-overlay__dismiss">Dismiss</button>
      </div>
      <p class="studio-agent-testing-overlay__hint">Page visible — clicks blocked. Status log below.</p>
      <ol class="studio-agent-testing-overlay__log"></ol>
    </div>
  `;
  const dismiss = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__dismiss"
  );
  dismiss?.addEventListener("click", () => {
    forceClearAgentTestingOverlay();
  });
  // Last child of body — paint above #root concept lightboxes.
  (document.body ?? document.documentElement).appendChild(root);
  return root;
}
function renderLog(): void {
  if (typeof document === "undefined") return;
  if (typeof document.getElementById !== "function") return;
  const root = document.getElementById(ROOT_ID);
  const list = root?.querySelector<HTMLOListElement>(
    ".studio-agent-testing-overlay__log"
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
    ".studio-agent-testing-overlay__title"
  );
  if (el) el.textContent = title;
}
function stamp(line: string): string {
  const t = new Date().toLocaleTimeString("en-GB", { hour12: false });
  return `${t}  ${line}`;
}
function releaseClickGuard(): void {
  if (typeof document === "undefined") return;
  delete document.documentElement.dataset.studioAgentTesting;
}
function teardownDom(): void {
  if (typeof document === "undefined") return;
  if (typeof document.getElementById !== "function") return;
  const root = document.getElementById(ROOT_ID);
  if (root) {
    root.dataset.active = "false";
    root.dataset.settling = "false";
    root.querySelector(".studio-agent-testing-overlay__history")?.remove();
  }
  delete document.documentElement.dataset.studioAgentTesting;
}
function scheduleReload(delayMs = 120): void {
  if (reloadPending || typeof window === "undefined") return;
  reloadPending = true;
  const resetToHub = settleResetToHub;
  // Defer so MCP evaluate_script can return the run result before navigation.
  window.setTimeout(() => {
    // Last chance: re-assert stay/hub URL before reload.
    try {
      resetStudioAfterAgentTest({ resetToHub });
    } catch {
      /* ignore */
    }
    window.location.reload();
  }, delayMs);
}

function safeResetStudio(resetToHub = settleResetToHub): void {
  try {
    resetStudioAfterAgentTest({ resetToHub });
  } catch {
    /* never leave overlay stuck because URL reset threw */
  }
}

function finishSettle(): void {
  settling = false;
  clearSettleTimer();
  dismissRoboCursor();
  teardownDom();
  safeResetStudio();
  unbindBeforeUnload();
  unbindVisibility();
  if (settleReload) {
    settleReload = false;
    scheduleReload(120);
  } else {
    settleResetToHub = false;
  }
}

function cancelSettle(instantReload?: boolean): void {
  const wantReload = settleReload || !!instantReload;
  settleReload = false;
  settling = false;
  clearSettleTimer();
  dismissRoboCursor();
  teardownDom();
  if (wantReload) scheduleReload(120);
  else {
    safeResetStudio();
    settleResetToHub = false;
  }
}

/**
 * Abandon DONE/SITREP to re-arm a new session — never fire a deferred reload
 * from the previous stop({ reload: true }). That race left PO with "no overlay"
 * after a mid-settle start/touch (page reloaded / panel stayed display:none).
 */
function abandonSettleForRearch(): void {
  settleReload = false;
  settleResetToHub = false;
  settling = false;
  clearSettleTimer();
  dismissRoboCursor();
  teardownDom();
}

function enterSettle(options?: StopAgentTestingOverlayOptions): void {
  const settleMs = clampSettleMs(options?.settleMs);
  settleReload = !!options?.reload;
  settleResetToHub = !!options?.resetToHub;
  settling = true;
  active = false;
  clearSafetyTimer();
  clearIdleTimer();
  clearPersist();
  const root = ensureRoot();
  if (root) {
    root.dataset.active = "false";
    root.dataset.settling = "true";
  }
  // Release pointer block so PO can use the page while reading sitrep.
  releaseClickGuard();
  // Strip ephemeral; stay on page unless resetToHub (reload re-asserts URL).
  safeResetStudio();
  setTitle(SITREP_TITLE);
  const endsAt = Date.now() + settleMs;
  const tickHint = () => {
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    setHint(formatSitrepHint(left, settleReload));
  };
  tickHint();
  renderLog();
  const history = pushHistory({
    title: sessionTitle,
    endedAt: Date.now(),
    lines: logLines.slice(-HISTORY_LINE_CAP),
  });
  renderHistory(history);
  clearSettleTimer();
  settleCountdownTimer = setInterval(tickHint, SITREP_COUNTDOWN_TICK_MS);
  settleTimer = setTimeout(() => {
    finishSettle();
  }, settleMs);
}
export function startAgentTestingOverlay(title?: string): void {
  if (settling) {
    abandonSettleForRearch();
  }
  nest += 1;
  active = true;
  settling = false;
  const resolved = resolveAgentTestingOverlayTitle(title);
  sessionTitle = resolved;
  const root = ensureRoot();
  if (root) {
    root.dataset.active = "true";
    root.dataset.settling = "false";
    root.querySelector(".studio-agent-testing-overlay__history")?.remove();
  }
  if (typeof document !== "undefined") {
    document.documentElement.dataset.studioAgentTesting = "true";
  }
  setTitle(resolved);
  setHint("Page visible — clicks blocked. Status log below.");
  writePersist(resolved);
  bindBeforeUnload();
  bindVisibility();
  noteActivity();
  if (nest === 1) {
    logLines = [];
    logAgentTestingOverlay("overlay start");
  }
  // DOM visibility gate — re-stamp if ensureRoot raced / orphan teardown.
  ensureAgentTestingOverlayDomArmed(resolved);
}

/**
 * True when the BR panel is painted (data-active / settling) — not only the JS flag.
 */
export function isAgentTestingOverlayDomVisible(): boolean {
  if (typeof document === "undefined") return false;
  const root = document.getElementById(ROOT_ID);
  if (!root) return false;
  return root.dataset.active === "true" || root.dataset.settling === "true";
}

/**
 * Force the BR panel into the painted active state. Safe to call every probe start.
 */
export function ensureAgentTestingOverlayDomArmed(title?: string): boolean {
  if (typeof document === "undefined") return false;
  const resolved = resolveAgentTestingOverlayTitle(title ?? sessionTitle);
  const root = ensureRoot();
  if (!root) return false;
  active = true;
  settling = false;
  root.dataset.active = "true";
  root.dataset.settling = "false";
  document.documentElement.dataset.studioAgentTesting = "true";
  setTitle(resolved);
  if (!root.querySelector(".studio-agent-testing-overlay__panel")) {
    // Corrupt orphan — rebuild.
    root.remove();
    const rebuilt = ensureRoot();
    if (!rebuilt) return false;
    rebuilt.dataset.active = "true";
    rebuilt.dataset.settling = "false";
    document.documentElement.dataset.studioAgentTesting = "true";
    setTitle(resolved);
  }
  return isAgentTestingOverlayDomVisible();
}
export function stopAgentTestingOverlay(
  options?: StopAgentTestingOverlayOptions
): void {
  try {
    if (options?.force) {
      nest = 0;
      settleResetToHub = !!options.resetToHub;
      settleReload = !!options.reload;
      if (active) logAgentTestingOverlay("overlay stop");
      active = false;
      clearSafetyTimer();
      clearIdleTimer();
      clearPersist();
      safeResetStudio();
      // Instant dismiss — skip sitrep settle.
      if (settling) {
        cancelSettle(!!options.reload);
        return;
      }
      unbindBeforeUnload();
      unbindVisibility();
      teardownDom();
      if (options.reload) scheduleReload(120);
      else settleResetToHub = false;
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
      else safeResetStudio();
      return;
    }
    logAgentTestingOverlay("overlay stop");
    enterSettle(options);
  } catch {
    // Last resort — never leave the click guard up.
    forceClearAgentTestingOverlay();
  }
}
/**
 * Ensure the BR panel is visible while an agent drives the tab.
 * Safe to call on every helper / DevTools evaluate — does not bump nest.
 */
export function touchAgentTestingOverlay(title?: string): void {
  if (settling) {
    abandonSettleForRearch();
  }
  if (active) {
    noteActivity();
    const resolved = resolveAgentTestingOverlayTitle(title);
    if (title?.trim()) {
      sessionTitle = resolved;
      setTitle(resolved);
    }
    // Repair invisible DOM (HMR / orphan teardown / z-index race).
    if (!isAgentTestingOverlayDomVisible()) {
      ensureAgentTestingOverlayDomArmed(resolved);
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
  noteActivity();
}
/** Instant clear — Dismiss button + stuck-overlay recovery. Never throws. */
export function forceClearAgentTestingOverlay(): void {
  try {
    nest = 0;
    active = false;
    settling = false;
    settleReload = false;
    reloadPending = false;
    clearSafetyTimer();
    clearIdleTimer();
    clearSettleTimer();
    clearPersist();
    unbindBeforeUnload();
    unbindVisibility();
    dismissRoboCursor();
    teardownDom();
    releaseClickGuard();
    safeResetStudio();
  } catch {
    try {
      dismissRoboCursor();
      teardownDom();
      releaseClickGuard();
    } catch {
      /* ignore */
    }
  }
}
export function isAgentTestingOverlayActive(): boolean {
  return active;
}
export function isAgentTestingOverlaySettling(): boolean {
  return settling;
}
function bindOverlayApi(api: OverlayApi): void {
  if (typeof window === "undefined") return;
  window.__protoAgentTestingOverlay = api;
  window.__studioAgentTestingOverlay = api;
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
        delete document.documentElement.dataset.studioAgentTesting;
      }
    }
    nest = 0;
    active = false;
    settling = false;
    settleReload = false;
    clearSettleTimer();
    clearIdleTimer();
    clearSafetyTimer();
  }
  const api: OverlayApi = {
    start: startAgentTestingOverlay,
    touch: touchAgentTestingOverlay,
    stop: (options) => stopAgentTestingOverlay(options),
    forceClear: forceClearAgentTestingOverlay,
    log: logAgentTestingOverlay,
    isActive: isAgentTestingOverlayActive,
  };
  bindOverlayApi(api);
}
export function uninstallAgentTestingOverlayApi(): void {
  nest = 0;
  active = false;
  settling = false;
  settleReload = false;
  logLines = [];
  reloadPending = false;
  clearSafetyTimer();
  clearIdleTimer();
  clearSettleTimer();
  clearPersist();
  unbindBeforeUnload();
  unbindVisibility();
  if (typeof document !== "undefined") {
    if (typeof document.getElementById === "function") {
      document.getElementById(ROOT_ID)?.remove();
    }
    delete document.documentElement.dataset.studioAgentTesting;
  }
  if (typeof window !== "undefined") {
    delete window.__protoAgentTestingOverlay;
    delete window.__studioAgentTestingOverlay;
  }
}
declare global {
  interface Window {
    __protoAgentTestingOverlay?: OverlayApi;
    __studioAgentTestingOverlay?: OverlayApi;
  }
}
