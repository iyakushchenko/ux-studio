/** Live activity line for the agent-testing overlay (PO mid-flight pulse). */

export type AgentTestingActivityPhase =
  | "idle"
  | "preparing"
  | "running"
  | "waiting"
  | "settling"
  | "paused";

export type AgentTestingSessionOwner = "manual" | "agent";

export function formatActivityStatus(
  phase: AgentTestingActivityPhase,
  detail?: string,
  owner: AgentTestingSessionOwner = "agent"
): string {
  const trimmed = detail?.trim();
  if (owner === "manual") {
    switch (phase) {
      case "paused":
        return trimmed ? `Paused — ${trimmed}` : "Paused — capture off";
      case "running":
        return trimmed ? `Logging… ${trimmed}` : "Logging…";
      case "settling":
        return trimmed ? `Settling… ${trimmed}` : "Settling…";
      default:
        return trimmed || "Manual idle";
    }
  }
  switch (phase) {
    case "preparing":
      return trimmed ? `Preparing… ${trimmed}` : "Preparing…";
    case "running":
      return trimmed ? `Running… ${trimmed}` : "Running script…";
    case "waiting":
      return trimmed ? `Waiting… ${trimmed}` : "Waiting…";
    case "settling":
      return trimmed ? `Settling… ${trimmed}` : "Settling sitrep…";
    case "paused":
      return trimmed ? `Paused… ${trimmed}` : "Paused…";
    default:
      return trimmed || "Idle";
  }
}
