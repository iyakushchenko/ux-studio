/** Shared types for the mid-flight AGENT TESTING QA shell. */

export type AgentTestingOverlayResult = "pass" | "fail" | "neutral";

/**
 * Row outcome — drives log + timeline colors (industry norms):
 * - fail = red (hard FAIL / chop / script-timeout / Play-stopping alarms)
 * - notice = amber (attention, not fatal)
 * - ok = neutral info (routine milestones)
 * - pass = green (explicit PASS / prove complete only — sparingly)
 */
export type AgentTestingStepOutcome = "ok" | "notice" | "fail" | "pass";

export type AgentTestingLogKind =
  | "info"
  | "step"
  | "helper"
  | "alarm"
  | "cursor"
  | "scroll"
  | "sequence"
  | "po-note"
  | "user-message"
  | "click"
  | "nav"
  | "system"
  | "init"
  | "agent-prompt"
  | "observe-escalate"
  /** PLAYBACK_DIAG / diagnostic monitor rows — color from outcome only. */
  | "playback-diag";

export type AgentTestingLogEntry = {
  atMs: number;
  timeLabel: string;
  label: string;
  outcome: AgentTestingStepOutcome;
  kind: AgentTestingLogKind;
  durationMs?: number;
  /** Whether duration is the event's own runtime or elapsed time since the previous row. */
  durationKind?: "operation" | "since-previous";
  /** Coalesced repeat count for identical helper spam. */
  count?: number;
  beatId?: string;
  touchpointKey?: string;
  action?: string;
  /** Forensics — dump/ring; keep visible label short. */
  selector?: string;
  chain?: string;
  surface?: "product" | "chrome" | "control-room";
  dataStudioAction?: string;
};

export type AgentTestingTimelineKey = {
  key: string;
  outcome: AgentTestingStepOutcome | "pending";
};

export type AgentTestingSitrep = {
  mode?: string;
  cjm?: string;
  experience?: string;
  projectId?: string;
  personaId?: string;
  screenId?: string;
  beat?: string;
  counter?: string;
  touchpointKey?: string;
  /** Full legacy line (dump / diagnostics). */
  line: string;
  /** Session bar — `Session: Localhost:5173 - Active` (live origin probe). */
  sessionLine: string;
};

export type LogAgentTestingStepInput = {
  label?: string;
  outcome?: AgentTestingStepOutcome;
  kind?: AgentTestingLogKind;
  beatId?: string;
  touchpointKey?: string;
  action?: string;
  durationMs?: number;
  /** Raw fallback line (compat with plain `log()`). */
  raw?: string;
};
