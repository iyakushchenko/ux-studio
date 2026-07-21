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
  formatSitrepHeldHint,
  holdSettleOpen,
  acknowledgeQaPlaybackDiagnostic,
  clearQaPlaybackBlocksForReset,
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
  downloadCurrentAgentTestingLog,
  appendAgentTestingSessionFinale,
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
  toggleAgentTestingLogger,
  handoffQaSession,
  askUserInQa,
  escalateObserveToAgentSession,
  unlockObserveSession,
  getAgentTestingMcpConnectionStatus,
  appendAgentTestingPoNote,
  appendAgentTestingUserMessage,
  scheduleAgentTestingOverlayEnsureClear,
  isAgentTestingOverlayActive,
  isAgentTestingOverlaySettling,
  installAgentTestingOverlayApi,
  uninstallAgentTestingOverlayApi,
  pauseForAgentLeave,
  resumeForAgentReturn,
  type AgentTestingOverlayResult,
  type AgentTestingStepOutcome,
  type AgentLeavePauseResult,
  type AgentReturnResumeResult,
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
  buildAgentTestingDumpFilename,
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

export {
  deriveAgentControlKind,
  formatAgentControlKindSuffix,
  isCjmCassetteOn,
  type AgentControlKind,
} from "@/app/shell/agent-testing/agentTestingControlKind";

export {
  getSessionKind,
  setSessionKind,
  isAgentLocked,
  canUserDismissSession,
  type AgentTestingSessionKind,
  type OpenQaLoggerOptions,
  type QaHandoffOptions,
} from "@/app/shell/agent-testing/agentTestingSession";

export {
  deriveMcpConnectionStatus,
  getQaPendingTimeoutMs,
  type McpConnectionPhase,
  type McpConnectionStatus,
} from "@/app/shell/agent-testing/agentTestingMcpStatus";

export {
  QA_SELF_TEST_SCENARIOS,
  listQaSelfTestTrustScenarios,
  type QaSelfTestScenario,
  type QaSelfTestScenarioId,
} from "@/app/shell/agent-testing/agentTestingSelfTest.scenarios";

export {
  runQaSelfTestSmoke,
  runQaSelfTestPureChecks,
  QA_SELF_TEST_STEP_MS,
  QA_SELF_TEST_SETTLE_MS,
  QA_SELF_TEST_CLEAR_MS,
  type QaSelfTestSmokeResult,
} from "@/app/shell/agent-testing/agentTestingSelfTest";

export {
  CHAT_BUBBLE_MOTION_EXPECTED_IDS,
  analyzeChatBubbleMotionSamples,
  assertChatBubbleMotionFromBundle,
  runChatBubbleMotionSelfTest,
  type ChatBubbleMotionSelfTestResult,
  type ChatBubbleMotionBubbleResult,
} from "@/app/shell/agent-testing/chatBubbleMotionSelfTest";

export {
  beginQaProveMode,
  endQaProveMode,
  isQaProveModeActive,
  QA_AGENT_AUTO_PAUSE_MS,
  QA_AGENT_PRESENT_MS,
  touchQaAgentPresence,
  clearQaAgentPresence,
  peekQaAgentPresence,
} from "@/app/shell/agent-testing/agentTestingPresence";
