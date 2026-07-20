/** Shared types for the mid-flight AGENT TESTING QA shell. */

export type AgentTestingOverlayResult = "pass" | "fail" | "neutral";

/** Row outcome — drives log + timeline colors. */
export type AgentTestingStepOutcome = "ok" | "soft-fail" | "fail";

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
  /** PLAYBACK_DIAG / diagnostic monitor rows (warn/error family). */
  | "playback-diag";

export type AgentTestingLogEntry = {
  atMs: number;
  timeLabel: string;
  label: string;
  outcome: AgentTestingStepOutcome;
  kind: AgentTestingLogKind;
  durationMs?: number;
  /** Coalesced repeat count for identical helper spam. */
  count?: number;
  beatId?: string;
  touchpointKey?: string;
  action?: string;
  /** Forensics — dump/ring; keep visible label short. */
  selector?: string;
  chain?: string;
  surface?: "product" | "chrome";
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
  /** Session bar only — mode / project / persona / CJM. */
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
