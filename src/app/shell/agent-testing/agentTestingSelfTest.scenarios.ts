/**
 * Restartable QA overlay self-test scenario catalog (no framework soup).
 * Agents re-run via SELF_TEST.md + `__studioRunQaSelfTestSmoke()` on :5173.
 */

export type QaSelfTestScenarioId =
  | "observe-open-capture"
  | "observe-page-click-log"
  | "observe-alarm-escalate"
  | "observe-unlock"
  | "ask-pending-reply"
  | "handoff-oversee-keeps-note"
  | "handoff-wipe-clears-note"
  | "refresh-mid-control"
  | "refresh-mid-observe"
  | "control-border-under-modal"
  | "rec-xor-keeps-overlay"
  | "empty-message-noop"
  | "bug-toggle-observe-noop"
  | "pause-stops-capture"
  | "control-room-interactive-only"
  | "session-origin-active"
  | "fail-handoff-freeze"
  | "presence-online-linked"
  | "message-rtt-helpers"
  | "control-kind-stepped-vs-playback"
  | "result-finale-seal"
  | "finale-to-manual-capture"
  | "close-no-ghost-chrome"
  | "session-kind-transition-invariants"
  | "message-withholds-result"
  | "stale-green-detect"
  | "diag-mirror-rows";

export type QaSelfTestScenario = {
  id: QaSelfTestScenarioId;
  dualRole: "user-observe" | "agent" | "both";
  /** Trust-breaker if fail — blocks “ready for real tasks”. */
  trust: boolean;
  summary: string;
  helpers: string[];
};

/** Durable checklist — keep in sync with SELF_TEST.md. */
export const QA_SELF_TEST_SCENARIOS: QaSelfTestScenario[] = [
  {
    id: "observe-open-capture",
    dualRole: "user-observe",
    trust: true,
    summary: "Open observe → capturing on + MCP OBSERVE (after connect flash).",
    helpers: ["__studioOpenQaLogger({ kind:'observe' })", "__studioMcpConnectionStatus()"],
  },
  {
    id: "observe-page-click-log",
    dualRole: "user-observe",
    trust: true,
    summary: "Page Click: rows appear while capturing (Studio nav chrome ignored by design).",
    helpers: ["Quick View / Book now on concept page"],
  },
  {
    id: "observe-alarm-escalate",
    dualRole: "both",
    trust: true,
    summary: "Alarm in observe escalates → agent + ALARM_SEQUENCE_MISMATCH latch.",
    helpers: ["Alarm CTA", "__studioPeekPoSignal / __studioConsumePoSignal"],
  },
  {
    id: "observe-unlock",
    dualRole: "agent",
    trust: true,
    summary: "After observe→agent escalate, unlockObserve returns to observe.",
    helpers: ["__studioAgentTestingOverlay.unlockObserve()"],
  },
  {
    id: "ask-pending-reply",
    dualRole: "agent",
    trust: true,
    summary: "Ask → PENDING; Message reply clears PENDING (no timeout race).",
    helpers: ["__studioAskUserInQa", "Message/Send"],
  },
  {
    id: "handoff-oversee-keeps-note",
    dualRole: "agent",
    trust: true,
    summary: "oversee:true keeps user-message in ring; kind agent|observe.",
    helpers: ["__studioQaHandoff({ oversee:true })"],
  },
  {
    id: "handoff-wipe-clears-note",
    dualRole: "agent",
    trust: true,
    summary: "oversee:false wipe → agent; prior user notes gone from ring.",
    helpers: ["__studioQaHandoff({ oversee:false })"],
  },
  {
    id: "refresh-mid-control",
    dualRole: "agent",
    trust: true,
    summary: "Reload mid-CONTROL restores agent (+ PENDING if awaiting).",
    helpers: ["sessionStorage studioQaDiagGate", "location.reload()"],
  },
  {
    id: "refresh-mid-observe",
    dualRole: "user-observe",
    trust: true,
    summary: "Reload mid-observe restores OBSERVE capturing session.",
    helpers: ["sessionStorage studioQaDiagGate.sessionKind=observe"],
  },
  {
    id: "control-border-under-modal",
    dualRole: "agent",
    trust: true,
    summary: "CONTROL gold inset remains with Quick View / Availability open under overlay.",
    helpers: ["data-rec / __frame inset box-shadow"],
  },
  {
    id: "rec-xor-keeps-overlay",
    dualRole: "both",
    trust: true,
    summary: "Toggling Studio REC does not force-clear active QA overlay.",
    helpers: ["REC switch", "overlay dataset.active"],
  },
  {
    id: "empty-message-noop",
    dualRole: "both",
    trust: false,
    summary: "Empty/whitespace Message does not append.",
    helpers: ["__studioAppendPoNote('  ') === false"],
  },
  {
    id: "bug-toggle-observe-noop",
    dualRole: "user-observe",
    trust: true,
    summary: "Bug icon does not close observe (Close × does).",
    helpers: ["__studioToggleQaLogger"],
  },
  {
    id: "pause-stops-capture",
    dualRole: "both",
    trust: true,
    summary: "Manual Pause → no Control Room / product click lines until Resume.",
    helpers: ["CAPTURE/Pause toggle", "bindAgentTestingCaptureWatch isCapturing"],
  },
  {
    id: "control-room-interactive-only",
    dualRole: "both",
    trust: true,
    summary: "Empty-space nav clicks ignored; buttons/toggles/tabs log Control room: …",
    helpers: ["buildClickDetail", "resolveClickElement"],
  },
  {
    id: "session-origin-active",
    dualRole: "both",
    trust: true,
    summary: "Session line = Session: Localhost:5173 - Active (live origin probe).",
    helpers: ["formatOriginSessionLine", "probeStudioOrigin"],
  },
  {
    id: "fail-handoff-freeze",
    dualRole: "agent",
    trust: true,
    summary: "Handing off → IsQaProgressFrozen + shouldBlockPlay until confirm.",
    helpers: ["__studioBeginQaFailHandoff", "__studioIsQaProgressFrozen", "__studioConfirmFailTakeover"],
  },
  {
    id: "presence-online-linked",
    dualRole: "agent",
    trust: true,
    summary: "Agent CONTROL shows ONLINE presence suffix when freshly touched.",
    helpers: ["peekQaAgentPresence", "formatMcpStatusLabel"],
  },
  {
    id: "message-rtt-helpers",
    dualRole: "agent",
    trust: true,
    summary: "Message send→consume records RTT; PENDING floor uses measured latency.",
    helpers: ["noteQaMessageSent", "noteQaMessageConsumed", "messageAwarePendingFloorMs"],
  },
  {
    id: "control-kind-stepped-vs-playback",
    dualRole: "agent",
    trust: true,
    summary: "Agent+CJM+Play → PLAYBACK; agent+CJM+parked → STEPPED PLAYBACK.",
    helpers: ["deriveAgentControlKind", "formatAgentControlKindSuffix"],
  },
  {
    id: "result-finale-seal",
    dualRole: "agent",
    trust: true,
    summary: "After RESULT seal, playback-diag housekeeping cannot land in chat.",
    helpers: ["sealAgentTestingFinale", "isAgentTestingFinaleSealed"],
  },
  {
    id: "finale-to-manual-capture",
    dualRole: "both",
    trust: true,
    summary:
      "Completed playback → close → fresh Manual clears finale and starts paused; CAPTURE can accept new events.",
    helpers: [
      "softCloseAgentTestingLogger",
      "__studioOpenQaLogger({ kind:'manual' })",
      "__studioAgentTestingOverlay.isCapturePaused",
    ],
  },
  {
    id: "close-no-ghost-chrome",
    dualRole: "both",
    trust: true,
    summary:
      "Close clears gate, OBS/CTRL hint, viewport lock/border state, pending state, and finale seal.",
    helpers: [
      "softCloseAgentTestingLogger",
      "document.documentElement.dataset.studioMcpStatus",
      "document.documentElement.dataset.studioQaLock",
    ],
  },
  {
    id: "session-kind-transition-invariants",
    dualRole: "both",
    trust: true,
    summary:
      "Manual opens paused; Observe captures with free page clicks; Agent captures locked; wipe/oversee obey context policy.",
    helpers: [
      "__studioQaSessionKind",
      "__studioAgentTestingOverlay.isCapturePaused",
      "shouldBlockPageClicks",
      "__studioQaHandoff",
    ],
  },
  {
    id: "message-withholds-result",
    dualRole: "agent",
    trust: true,
    summary: "Open USER_MESSAGE latch withholds appendFinale RESULT.",
    helpers: ["appendFinale", "peekPoSignal USER_MESSAGE_RECEIVED"],
  },
  {
    id: "stale-green-detect",
    dualRole: "both",
    trust: true,
    summary: "Snap vs URL diverge → amber + one lean stale-green sitrep line.",
    helpers: ["detectStaleGreenMismatches", "noteStaleGreenIfChanged"],
  },
  {
    id: "diag-mirror-rows",
    dualRole: "both",
    trust: true,
    summary: "In-panel PLAYBACK_DIAG mirror shows last-N events with severity.",
    helpers: ["getDiagMirrorRows", ".studio-agent-testing-overlay__diag-mirror"],
  },
];

export function listQaSelfTestTrustScenarios(): QaSelfTestScenario[] {
  return QA_SELF_TEST_SCENARIOS.filter((s) => s.trust);
}
