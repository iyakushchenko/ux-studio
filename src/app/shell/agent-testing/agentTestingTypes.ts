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
  | "sequence";

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
};

export type AgentTestingTimelineKey = {
  key: string;
  outcome: AgentTestingStepOutcome | "pending";
};

export type AgentTestingSitrep = {
  mode?: string;
  cjm?: string;
  experience?: string;
  screenId?: string;
  beat?: string;
  counter?: string;
  touchpointKey?: string;
  line: string;
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
