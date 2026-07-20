/**
 * MCP chrome paint — nav OBS/CTRL hint, Message diode+label, viewport border.
 * Live only when overlay is truly open (active + gate + visible). Never ghost.
 */

import {
  deriveMcpConnectionStatus,
  type McpConnectionStatus,
} from "@/app/shell/agent-testing/agentTestingMcpStatus";
import type { AgentTestingSessionKind } from "@/app/shell/agent-testing/agentTestingSession";

export type McpChromeLiveInput = {
  active: boolean;
  settling: boolean;
  sessionKind: AgentTestingSessionKind;
  awaitingReply: boolean;
  gateOpen: boolean;
  overlayDomVisible: boolean;
  rootId: string;
};

export function isMcpChromeLive(input: {
  active: boolean;
  settling: boolean;
  gateOpen: boolean;
  overlayDomVisible: boolean;
}): boolean {
  return (
    input.active &&
    !input.settling &&
    input.gateOpen &&
    input.overlayDomVisible
  );
}

export function deriveLiveMcpStatus(input: McpChromeLiveInput): McpConnectionStatus {
  const live = isMcpChromeLive(input);
  return deriveMcpConnectionStatus({
    overlayActive: live,
    sessionKind: live ? input.sessionKind : "manual",
    awaitingReply: live ? input.awaitingReply : false,
  });
}

export function clearNavMcpHintDom(): void {
  if (typeof document === "undefined") return;
  if (typeof document.querySelector !== "function") return;
  const navHint = document.querySelector<HTMLElement>(
    ".studio-nav-version__mcp"
  );
  if (navHint) {
    navHint.hidden = true;
    navHint.textContent = "";
    delete navHint.dataset.phase;
  }
  const html = document.documentElement;
  if (html?.dataset) {
    delete html.dataset.studioMcpStatus;
  }
}

function shortNavPhase(phase: string): string {
  switch (phase) {
    case "pending":
      return "PENDING";
    case "control":
      return "CTRL";
    case "observe":
      return "OBS";
    case "connecting":
      return "…";
    case "connected":
      return "OK";
    case "error":
      return "ERR";
    default:
      return "";
  }
}

/** Paint diode + label + nav hint + viewport border from live status. */
export function paintMcpChromeDom(
  input: McpChromeLiveInput,
  status: McpConnectionStatus
): void {
  if (typeof document === "undefined") return;
  if (typeof document.getElementById !== "function") return;

  const live = isMcpChromeLive(input);
  const root = document.getElementById(input.rootId);
  const wrap = root?.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__mcp-status"
  );
  const chip = root?.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__mcp"
  );
  let diode = root?.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__mcp-diode"
  );
  if (wrap && !diode) {
    diode = document.createElement("span");
    diode.className = "studio-agent-testing-overlay__mcp-diode";
    diode.setAttribute("aria-hidden", "true");
    wrap.insertBefore(diode, wrap.firstChild);
  }
  root
    ?.querySelectorAll(".studio-agent-testing-overlay__mcp-mode")
    .forEach((el) => el.remove());

  const show = live && !!status.label && status.phase !== "idle";
  if (chip) {
    if (!show) {
      chip.hidden = true;
      chip.textContent = "";
      delete chip.dataset.phase;
      if (wrap) wrap.hidden = true;
      if (diode) {
        diode.hidden = true;
        delete diode.dataset.phase;
      }
    } else {
      chip.hidden = false;
      chip.textContent = status.label;
      chip.dataset.phase = status.phase;
      chip.title = status.label;
      if (wrap) wrap.hidden = false;
      if (diode) {
        diode.hidden = false;
        diode.dataset.phase = status.phase;
        diode.title = status.label;
      }
    }
  }
  if (root) {
    if (
      !show ||
      status.phase === "idle" ||
      (status.phase !== "control" &&
        status.phase !== "pending" &&
        status.phase !== "error")
    ) {
      delete root.dataset.mcp;
    } else {
      root.dataset.mcp = status.phase;
    }
  }
  const html = document.documentElement;
  if (html?.dataset) {
    if (!show) delete html.dataset.studioMcpStatus;
    else html.dataset.studioMcpStatus = status.phase;
  }
  const navHint = document.querySelector<HTMLElement>(
    ".studio-nav-version__mcp"
  );
  if (navHint) {
    if (!show) {
      navHint.hidden = true;
      navHint.textContent = "";
      delete navHint.dataset.phase;
    } else {
      navHint.hidden = false;
      navHint.textContent = shortNavPhase(status.phase);
      navHint.dataset.phase = status.phase;
      navHint.title = status.label;
    }
  }
}
