/**
 * QA tool popup — solid action state machine (no CSS-only CTA hide).
 *
 * **User agentic QA mode** (`agentic-user`) = product QA chrome for humans /
 * agentic browsing: session kind `manual` | `observe`. Run Test is unavailable.
 *
 * Suite / control-room operator chrome = session kind `agent` (+ suite
 * selection / running). Programmatic `__studioRunQaSuiteById` stays independent.
 */

import type { AgentTestingSessionKind } from "@/app/shell/agent-testing/agentTestingSession";
import { resolveCaptureToggleLabel } from "@/app/shell/agent-testing/agentTestingActivity";

/** Explicit popup action modes — map CTA visibility from these only. */
export type QaPopupActionState =
  | "idle"
  | "agentic-user"
  | "prove"
  | "suite-armed"
  | "suite-running";

export type QaSuitePhase = "idle" | "running" | "paused-failure" | "passed" | "cancelled";

export type QaPopupActionInput = {
  active: boolean;
  settling: boolean;
  sessionKind: AgentTestingSessionKind;
  /** Selected suite id (empty = none). */
  selectedSuiteId: string;
  suitePhase: QaSuitePhase | null | undefined;
  capturePaused: boolean;
  sessionHadProgress: boolean;
};

export type QaPopupPrimaryCtaKind = "hidden" | "capture" | "run-test" | "running";

export type QaPopupPrimaryCta = {
  kind: QaPopupPrimaryCtaKind;
  label: string;
  /** Not in DOM / `hidden` — not merely disabled. */
  hidden: boolean;
  disabled: boolean;
  /** aria-disabled when present but inert (suite-running). */
  ariaDisabled: boolean;
  title: string;
};

export type QaPopupActionsChrome = {
  state: QaPopupActionState;
  /** Suite picker visible only in control-room / suite states. */
  suitePickerVisible: boolean;
  primary: QaPopupPrimaryCta;
  /** True when Run Test must not render and must not activate. */
  runTestUnavailable: boolean;
};

/** Product QA chrome (manual + observe) — PO “user agentic QA mode”. */
export function isUserAgenticQaMode(sessionKind: AgentTestingSessionKind): boolean {
  return sessionKind === "manual" || sessionKind === "observe";
}

export function resolveQaPopupActionState(input: QaPopupActionInput): QaPopupActionState {
  if (!input.active && !input.settling) return "idle";
  if (input.suitePhase === "running") return "suite-running";
  if (isUserAgenticQaMode(input.sessionKind)) return "agentic-user";
  // sessionKind === "agent" (control room)
  if (input.selectedSuiteId) return "suite-armed";
  return "prove";
}

function captureTitle(
  kind: AgentTestingSessionKind,
  label: "CAPTURE" | "Pause" | "Resume",
): string {
  if (label === "Pause") {
    return kind === "agent"
      ? "Pause — freeze clock + halt Play; type Message, then Resume"
      : "Pause — freeze clock + stop capture";
  }
  if (label === "Resume") {
    return kind === "agent"
      ? "Resume capture (does not auto-Play — transport stays stopped)"
      : "Resume capture + clock";
  }
  return "Start capture + clock";
}

export function resolveQaPopupActionsChrome(
  input: QaPopupActionInput & { suiteDescription?: string },
): QaPopupActionsChrome {
  const state = resolveQaPopupActionState(input);
  const showChrome = input.active && !input.settling;

  if (state === "idle" || !showChrome) {
    return {
      state: state === "idle" ? "idle" : state,
      suitePickerVisible: false,
      primary: {
        kind: "hidden",
        label: "CAPTURE",
        hidden: true,
        disabled: true,
        ariaDisabled: true,
        title: "Open a QA session",
      },
      runTestUnavailable: true,
    };
  }

  if (state === "suite-running") {
    return {
      state,
      suitePickerVisible: !isUserAgenticQaMode(input.sessionKind),
      primary: {
        kind: "running",
        label: "Running…",
        hidden: false,
        disabled: true,
        ariaDisabled: true,
        title: "Suite running — wait for finish or stop via suite API",
      },
      runTestUnavailable: true,
    };
  }

  if (state === "agentic-user") {
    const label = resolveCaptureToggleLabel({
      capturePaused: input.capturePaused,
      sessionHadProgress: input.sessionHadProgress,
    });
    return {
      state,
      suitePickerVisible: false,
      primary: {
        kind: "capture",
        label,
        hidden: false,
        disabled: false,
        ariaDisabled: false,
        title: captureTitle(input.sessionKind, label),
      },
      runTestUnavailable: true,
    };
  }

  if (state === "suite-armed") {
    return {
      state,
      suitePickerVisible: true,
      primary: {
        kind: "run-test",
        label: "Run Test",
        hidden: false,
        disabled: false,
        ariaDisabled: false,
        title: input.suiteDescription ?? "Run selected autonomous QA suite",
      },
      runTestUnavailable: false,
    };
  }

  // prove — agent control room, no suite selected
  const label = resolveCaptureToggleLabel({
    capturePaused: input.capturePaused,
    sessionHadProgress: input.sessionHadProgress,
  });
  return {
    state,
    suitePickerVisible: true,
    primary: {
      kind: "capture",
      label,
      hidden: false,
      disabled: false,
      ariaDisabled: false,
      title: captureTitle(input.sessionKind, label),
    },
    runTestUnavailable: true,
  };
}

/** Click path: only suite-armed may launch a suite from the primary CTA. */
export function canActivateRunTestFromPopup(state: QaPopupActionState): boolean {
  return state === "suite-armed";
}
