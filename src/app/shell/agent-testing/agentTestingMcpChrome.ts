/**
 * QA latch chrome paint — nav OBS/CTRL hint, Message diode+label, viewport border.
 * Live only when overlay is truly open (active + gate + visible). Never ghost.
 * Labels = in-app AGENT latch (not Cursor MCP).
 */

import {
  AGENT_LATCH_STATUS_TITLE,
  deriveMcpConnectionStatus,
  type McpConnectionStatus,
} from "@/app/shell/agent-testing/agentTestingMcpStatus";
import { peekQaAgentPresence } from "@/app/shell/agent-testing/agentTestingPresence";
import type { AgentTestingSessionKind } from "@/app/shell/agent-testing/agentTestingSession";
import type { AgentControlKind } from "@/app/shell/agent-testing/agentTestingControlKind";

export type McpChromeLiveInput = {
  active: boolean;
  settling: boolean;
  sessionKind: AgentTestingSessionKind;
  awaitingReply: boolean;
  agentControlKind?: AgentControlKind | null;
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
    agentControlKind: live ? input.agentControlKind ?? null : null,
  });
}

/** Phases that read as "an agent session is actually live" — green icon. Error
 * is deliberately excluded (broken ≠ connected) even though it carries a label. */
const MCP_NAV_CONNECTED_PHASES = new Set([
  "connecting",
  "connected",
  "control",
  "observe",
  "pending",
]);

export function clearNavMcpHintDom(): void {
  if (typeof document === "undefined") return;
  if (typeof document.querySelector !== "function") return;
  const navHint = document.querySelector<HTMLElement>(
    ".studio-nav-version__mcp"
  );
  if (navHint) {
    // Persistent icon — never hide, just drop back to muted/disconnected.
    navHint.hidden = false;
    navHint.dataset.connected = "false";
    delete navHint.dataset.phase;
    navHint.title = `Agent MCP — idle — ${AGENT_LATCH_STATUS_TITLE}`;
  }
  const html = document.documentElement;
  if (html?.dataset) {
    delete html.dataset.studioMcpStatus;
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
  const presence = peekQaAgentPresence();
  const presenceAttr = presence.online
    ? "online"
    : presence.lastSeenAt > 0
      ? "stale"
      : "offline";
  if (chip) {
    if (!show) {
      chip.hidden = true;
      chip.textContent = "";
      delete chip.dataset.phase;
      delete chip.dataset.presence;
      if (wrap) {
        wrap.hidden = true;
        delete wrap.dataset.presence;
      }
      if (diode) {
        diode.hidden = true;
        delete diode.dataset.phase;
        delete diode.dataset.presence;
      }
    } else {
      chip.hidden = false;
      chip.textContent = status.label;
      chip.dataset.phase = status.phase;
      chip.dataset.presence = presenceAttr;
      chip.title = `${status.label} — ${AGENT_LATCH_STATUS_TITLE}`;
      if (wrap) {
        wrap.hidden = false;
        wrap.title = AGENT_LATCH_STATUS_TITLE;
        wrap.dataset.presence = presenceAttr;
      }
      if (diode) {
        diode.hidden = false;
        diode.dataset.phase = status.phase;
        // Green glow only when agent is actually present — never while stale.
        diode.dataset.presence = presenceAttr;
        diode.title = `${status.label} — ${AGENT_LATCH_STATUS_TITLE}`;
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
    // Icon persists always; only its color (via data-connected) and title change.
    navHint.hidden = false;
    const connected = live && MCP_NAV_CONNECTED_PHASES.has(status.phase);
    navHint.dataset.connected = connected ? "true" : "false";
    if (show) {
      navHint.dataset.phase = status.phase;
      navHint.title = `${status.label} — ${AGENT_LATCH_STATUS_TITLE}`;
    } else {
      delete navHint.dataset.phase;
      navHint.title = `Agent MCP — idle — ${AGENT_LATCH_STATUS_TITLE}`;
    }
  }
}
