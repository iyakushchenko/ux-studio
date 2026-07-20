import { describe, expect, it, beforeEach } from "vitest";
import {
  bugIconClosesSession,
  canUserDismissSession,
  escalateObserveToAgent,
  getSessionKind,
  isAgentLocked,
  isAwaitingUserReply,
  isLoggerStyleSession,
  resetQaSessionForTests,
  resolveHandoffKind,
  resolveOpenKind,
  setAwaitingUserReply,
  setSessionKind,
  shouldBlockPageClicks,
  shouldWipeOnHandoff,
  titleForSessionKind,
  unlockAgentToObserve,
  wasEscalatedFromObserve,
} from "@/app/shell/agent-testing/agentTestingSession";

describe("agentTestingSession", () => {
  beforeEach(() => {
    resetQaSessionForTests();
  });

  it("defaults manual: dismissible, bug closes, no click block", () => {
    expect(getSessionKind()).toBe("manual");
    expect(isAgentLocked()).toBe(false);
    expect(canUserDismissSession()).toBe(true);
    expect(bugIconClosesSession()).toBe(true);
    expect(isLoggerStyleSession()).toBe(true);
    expect(shouldBlockPageClicks()).toBe(false);
    expect(titleForSessionKind("manual")).toBe("MANUAL TEST");
  });

  it("agent lock: no dismiss, bug does not close, blocks page clicks", () => {
    setSessionKind("agent");
    expect(isAgentLocked()).toBe(true);
    expect(canUserDismissSession()).toBe(false);
    expect(bugIconClosesSession()).toBe(false);
    expect(isLoggerStyleSession()).toBe(false);
    expect(shouldBlockPageClicks()).toBe(true);
    expect(titleForSessionKind("agent")).toBe("AGENT TESTING");
  });

  it("observe: dismissible, bug does not toggle-close, logger-style", () => {
    setSessionKind("observe");
    expect(canUserDismissSession()).toBe(true);
    expect(bugIconClosesSession()).toBe(false);
    expect(isLoggerStyleSession()).toBe(true);
    expect(shouldBlockPageClicks()).toBe(false);
    expect(titleForSessionKind("observe")).toBe("OBSERVE");
  });

  it("escalates observe → agent and unlocks back", () => {
    setSessionKind("observe");
    expect(escalateObserveToAgent()).toBe(true);
    expect(getSessionKind()).toBe("agent");
    expect(wasEscalatedFromObserve()).toBe(true);
    expect(unlockAgentToObserve()).toBe(true);
    expect(getSessionKind()).toBe("observe");
    expect(wasEscalatedFromObserve()).toBe(false);
  });

  it("escalate/unlock no-ops from wrong kind", () => {
    setSessionKind("manual");
    expect(escalateObserveToAgent()).toBe(false);
    setSessionKind("agent");
    expect(unlockAgentToObserve()).toBe(false);
  });

  it("handoff wipe vs oversee", () => {
    expect(shouldWipeOnHandoff({})).toBe(true);
    expect(shouldWipeOnHandoff({ oversee: false })).toBe(true);
    expect(shouldWipeOnHandoff({ oversee: true })).toBe(false);
    expect(resolveHandoffKind({ oversee: true, kind: "observe" })).toBe(
      "observe"
    );
    expect(resolveHandoffKind({ oversee: true })).toBe("agent");
    // kind wins for target; wipe is separate (shouldWipeOnHandoff)
    expect(resolveHandoffKind({ oversee: false, kind: "observe" })).toBe(
      "observe"
    );
  });

  it("resolveOpenKind defaults and accepts string | options", () => {
    expect(resolveOpenKind()).toBe("manual");
    expect(resolveOpenKind("agent")).toBe("agent");
    expect(resolveOpenKind({ kind: "observe" })).toBe("observe");
    expect(resolveOpenKind({ oversee: true })).toBe("manual");
  });

  it("awaiting reply latch + cleared on manual set", () => {
    setSessionKind("agent");
    setAwaitingUserReply(true);
    expect(isAwaitingUserReply()).toBe(true);
    setSessionKind("manual");
    expect(isAwaitingUserReply()).toBe(false);
  });

  it("rapid kind switches stay coherent", () => {
    setSessionKind("manual");
    setSessionKind("agent");
    setSessionKind("observe");
    expect(escalateObserveToAgent()).toBe(true);
    expect(getSessionKind()).toBe("agent");
    setAwaitingUserReply(true);
    expect(unlockAgentToObserve()).toBe(true);
    expect(isAwaitingUserReply()).toBe(false);
    setSessionKind("manual");
    expect(bugIconClosesSession()).toBe(true);
  });
});
