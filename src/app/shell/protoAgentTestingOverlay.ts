/**
 * Tiny full-viewport overlay while agent MCP / `__protoRun*` tests run.
 * PO can hide DevTools and still see status without clicking the page.
 *
 *   window.__protoAgentTestingOverlay?.start()
 *   window.__protoAgentTestingOverlay?.log("clicked Book Step 2")
 *   window.__protoAgentTestingOverlay?.stop()
 */

const ROOT_ID = "proto-agent-testing-overlay";
const LOG_LIMIT = 80;

type OverlayApi = {
  start: (title?: string) => void;
  stop: (options?: { force?: boolean }) => void;
  log: (line: string) => void;
  isActive: () => boolean;
};

let active = false;
let logLines: string[] = [];
let nest = 0;

function ensureRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let root = document.getElementById(ROOT_ID);
  if (root) return root;

  root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = "proto-agent-testing-overlay";
  root.setAttribute("aria-live", "polite");
  root.innerHTML = `
    <div class="proto-agent-testing-overlay__panel">
      <p class="proto-agent-testing-overlay__title">AGENT TESTING IN PROGRESS</p>
      <p class="proto-agent-testing-overlay__hint">Page clicks blocked — hide DevTools if you like; status stays here.</p>
      <ol class="proto-agent-testing-overlay__log"></ol>
    </div>
  `;
  document.documentElement.appendChild(root);
  return root;
}

function renderLog(): void {
  if (typeof document === "undefined") return;
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

export function startAgentTestingOverlay(title?: string): void {
  nest += 1;
  active = true;
  const root = ensureRoot();
  if (root) root.dataset.active = "true";
  if (typeof document !== "undefined") {
    document.documentElement.dataset.protoAgentTesting = "true";
  }
  if (title) setTitle(title);
  else setTitle("AGENT TESTING IN PROGRESS");
  if (nest === 1) {
    logLines = [];
    logAgentTestingOverlay("overlay start");
  }
}

export function stopAgentTestingOverlay(options?: { force?: boolean }): void {
  if (options?.force) nest = 0;
  else nest = Math.max(0, nest - 1);
  if (nest > 0) return;
  if (active) logAgentTestingOverlay("overlay stop");
  active = false;
  if (typeof document !== "undefined") {
    const root = document.getElementById(ROOT_ID);
    if (root) root.dataset.active = "false";
    delete document.documentElement.dataset.protoAgentTesting;
  }
}

export function logAgentTestingOverlay(line: string): void {
  if (!active && !document.getElementById(ROOT_ID)) return;
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

export function installAgentTestingOverlayApi(): void {
  if (typeof window === "undefined") return;
  const api: OverlayApi = {
    start: startAgentTestingOverlay,
    stop: (options) => stopAgentTestingOverlay(options),
    log: logAgentTestingOverlay,
    isActive: isAgentTestingOverlayActive,
  };
  window.__protoAgentTestingOverlay = api;
}

export function uninstallAgentTestingOverlayApi(): void {
  nest = 0;
  active = false;
  logLines = [];
  if (typeof document !== "undefined") {
    document.getElementById(ROOT_ID)?.remove();
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
