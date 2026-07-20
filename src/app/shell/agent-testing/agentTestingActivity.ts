/** Live activity line for the agent-testing overlay (PO mid-flight pulse). */

import type { AgentTestingSessionKind } from "@/app/shell/agent-testing/agentTestingSession";

export type AgentTestingActivityPhase =
  | "idle"
  | "preparing"
  | "running"
  | "waiting"
  | "settling"
  | "paused";

/** @deprecated Prefer AgentTestingSessionKind from agentTestingSession */
export type AgentTestingSessionOwner = AgentTestingSessionKind;

/** Drop noise details that produce “Logging… logger” class copy. */
function meaningfulDetail(detail?: string): string | undefined {
  const trimmed = detail?.trim();
  if (!trimmed) return undefined;
  if (
    /^(logger|resumed|paused|capture on|capture off|capture|capture paused|capture resumed|user-message|po-note|overlay start|overlay stop|ready|reply)$/i.test(
      trimmed
    )
  ) {
    return undefined;
  }
  if (/^[A-Z][a-zA-Z0-9]{0,40}$/.test(trimmed) && !/\s/.test(trimmed)) {
    const soft = trimmed.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
    if (soft.includes("type in") || soft.includes("typein")) return "type-in";
    if (soft.includes("click")) return "click";
    if (soft.includes("scroll")) return "scroll";
    if (soft.includes("cursor")) return "cursor";
  }
  if (/type-?in/i.test(trimmed)) return "type-in";
  if (trimmed.length > 32) return `${trimmed.slice(0, 30)}…`;
  return trimmed;
}

/**
 * Capture toggle label — CAPTURE (fresh/reset) vs Resume (paused with progress) vs Pause.
 * Keep in sync with overlay `syncSessionChrome` (no invented third states).
 */
export function resolveCaptureToggleLabel(input: {
  capturePaused: boolean;
  sessionHadProgress: boolean;
}): "CAPTURE" | "Pause" | "Resume" {
  if (!input.capturePaused) return "Pause";
  if (input.sessionHadProgress) return "Resume";
  return "CAPTURE";
}

export function formatActivityStatus(
  phase: AgentTestingActivityPhase,
  detail?: string,
  kind: AgentTestingSessionKind = "agent"
): string {
  const tip = meaningfulDetail(detail);
  if (kind === "manual") {
    switch (phase) {
      case "paused":
        return "Paused";
      case "running":
        return tip ? `Capturing — ${tip}` : "Capturing";
      case "settling":
        return "Closing…";
      default:
        return "Idle";
    }
  }
  if (kind === "observe") {
    switch (phase) {
      case "paused":
        return "Paused";
      case "running":
        return tip ? `Observing — ${tip}` : "Observing";
      case "settling":
        return "Closing…";
      default:
        return "Idle";
    }
  }
  switch (phase) {
    case "preparing":
      return tip ? `Getting ready — ${tip}` : "Getting ready…";
    case "running":
      return tip ? `Agent running: ${tip}` : "Agent running";
    case "waiting":
      return tip ? `Waiting — ${tip}` : "Awaiting reply";
    case "settling":
      return "Wrapping up…";
    case "paused":
      return "Paused";
    default:
      return "Idle";
  }
}
