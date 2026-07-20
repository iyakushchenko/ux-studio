/**
 * Mid-flight AGENT TESTING QA shell.
 * Prefer imports from `@/app/shell/agent-testing`.
 * Compat re-export: `@/app/shell/agentTestingOverlay`.
 */

export {
  IDLE_MS,
  DEFAULT_SETTLE_MS,
  DEFAULT_PREARM_MS,
  resolveAgentTestingOverlayTitle,
  formatSitrepHint,
  formatSitrepTitle,
  clampPreArmMs,
  formatPreArmHint,
  formatActivityStatus,
  startAgentTestingOverlay,
  preArmAgentTestingOverlay,
  isAgentTestingOverlayDomVisible,
  ensureAgentTestingOverlayDomArmed,
  stopAgentTestingOverlay,
  touchAgentTestingOverlay,
  logAgentTestingOverlay,
  logAgentTestingStep,
  logAgentTestingHelper,
  ringAgentTestingAlarm,
  flagAgentTestingCursorWeird,
  flagAgentTestingScrollIssue,
  setAgentTestingTimeline,
  markAgentTestingTimeline,
  isAgentTestingOverlayDomPresent,
  forceClearAgentTestingOverlay,
  openAgentTestingLogger,
  softCloseAgentTestingLogger,
  appendAgentTestingPoNote,
  appendAgentTestingUserMessage,
  scheduleAgentTestingOverlayEnsureClear,
  isAgentTestingOverlayActive,
  isAgentTestingOverlaySettling,
  installAgentTestingOverlayApi,
  uninstallAgentTestingOverlayApi,
  type AgentTestingOverlayResult,
  type AgentTestingStepOutcome,
  type LogAgentTestingStepInput,
  type StopAgentTestingOverlayOptions,
} from "@/app/shell/agent-testing/agentTestingOverlay";

export {
  formatElapsed,
  formatDurationMs,
  inferOutcomeFromText,
  formatHelperStepLabel,
  humanizeHelperSuffix,
  buildLogEntryFromPlain,
  buildLogEntryFromStep,
  coalesceLogEntry,
  formatLogRowText,
} from "@/app/shell/agent-testing/agentTestingFormat";

export {
  AGENT_TESTING_DUMP_KEY,
  AGENT_TESTING_DUMP_MAX,
  readAgentTestingDumps,
  pushAgentTestingDump,
  buildAgentTestingDump,
  downloadAgentTestingDump,
  consoleSeparator,
  type AgentTestingDump,
  type AgentTestingDumpReason,
} from "@/app/shell/agent-testing/agentTestingDump";

export {
  PO_SIGNAL_EVENT,
  latchPoSignal,
  peekPoSignal,
  consumePoSignal,
  clearPoSignal,
  installPoSignalWindowApis,
  uninstallPoSignalWindowApis,
  type AgentTestingPoSignal,
  type AgentTestingPoSignalType,
  type AgentTestingPoSignalCode,
} from "@/app/shell/agent-testing/agentTestingPoSignal";

export {
  registerPoSignalPlaybackHalt,
  haltPlaybackForPoSignal,
  acknowledgePlaybackDiagnosticStop,
  installPoSignalPlaybackHaltWindowApis,
  uninstallPoSignalPlaybackHaltWindowApis,
} from "@/app/shell/agent-testing/agentTestingPlaybackHalt";

export { readAgentTestingSitrep } from "@/app/shell/agent-testing/agentTestingSitrep";
