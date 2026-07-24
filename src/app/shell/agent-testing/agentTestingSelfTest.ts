/**
 * Lean QA overlay self-test smoke for MCP / agents.
 * Full dual-role checklist: SELF_TEST.md — this runner covers fast trust checks only.
 *
 * Pace: near real-life, slightly faster (not ultra-fast) — avoids flaky CONNECTING flash
 * and false fails from racing DOM. See QA_SELF_TEST_*_MS constants + SELF_TEST.md.
 */

import { buildClickDetail } from "@/app/shell/agent-testing/agentTestingCaptureWatch";
import {
  deriveAgentControlKind,
  formatAgentControlKindSuffix,
} from "@/app/shell/agent-testing/agentTestingControlKind";
import { getDiagMirrorRows } from "@/app/shell/agent-testing/agentTestingDiagMirror";
import {
  beginFailHandoff,
  clearFailHandoff,
  confirmAgentFailTakeover,
  resetFailHandoffForTests,
} from "@/app/shell/agent-testing/agentTestingFailHandoff";
import {
  clearAgentTestingFinaleSeal,
  isAgentTestingFinaleSealed,
  sealAgentTestingFinale,
} from "@/app/shell/agent-testing/agentTestingFinaleSeal";
import {
  formatOriginHostLabel,
  formatOriginSessionLine,
  resetOriginProbeForTests,
} from "@/app/shell/agent-testing/agentTestingOriginProbe";
import {
  clearQaAgentPresence,
  peekQaAgentPresence,
  touchQaAgentPresence,
} from "@/app/shell/agent-testing/agentTestingPresence";
import {
  clearQaProgressFreeze,
  isQaProgressFrozen,
  setQaProgressFreeze,
} from "@/app/shell/agent-testing/agentTestingProgressFreeze";
import {
  getQaMessageRttStats,
  messageAwarePendingFloorMs,
  noteQaMessageConsumed,
  noteQaMessageSent,
  resetQaMessageRttForTests,
} from "@/app/shell/agent-testing/agentTestingMessageRtt";
import { QA_SELF_TEST_SCENARIOS } from "@/app/shell/agent-testing/agentTestingSelfTest.scenarios";
import {
  escalateObserveToAgent,
  getSessionKind,
  resetQaSessionForTests,
  resolveHandoffKind,
  setSessionKind,
  shouldWipeOnHandoff,
  unlockAgentToObserve,
} from "@/app/shell/agent-testing/agentTestingSession";
import {
  detectStaleGreenMismatches,
  resetStaleGreenForTests,
} from "@/app/shell/agent-testing/agentTestingStaleGreen";
import { shouldBlockQaPlay } from "@/app/shell/agent-testing/agentTestingListen";
import { formatMcpStatusLabel } from "@/app/shell/agent-testing/agentTestingMcpStatus";
import {
  auditQuietHelpersNotTouchWrapped,
  QA_SUITE_TOUCH_WRAP_DIG,
} from "@/app/shell/qaSuiteTouchWrapContract";

/**
 * Between discrete UI actions (click, ask, toggle) — slightly faster than human,
 * slower than hammering (200–500ms band; default 350).
 */
export const QA_SELF_TEST_STEP_MS = 350;

/**
 * After open/handoff — cover MCP CONNECTING(280)+CONNECTED(500) flash (~780ms)
 * with a little cushion (matches light Play dwell floors, not marathon waits).
 */
export const QA_SELF_TEST_SETTLE_MS = 900;

/** Brief clear/teardown pause before next open. */
export const QA_SELF_TEST_CLEAR_MS = 250;

export type QaSelfTestSmokeResult = {
  ok: boolean;
  atIso: string;
  scenarioCount: number;
  catalogScenarioCount: number;
  paceMs: { step: number; settle: number; clear: number };
  checks: Array<{ id: string; ok: boolean; detail?: string }>;
};

function check(id: string, ok: boolean, detail?: string) {
  return { id, ok, detail };
}

/** Pure/session checks — always safe in Vitest + browser. */
export function runQaSelfTestPureChecks(): QaSelfTestSmokeResult["checks"] {
  resetQaSessionForTests();
  resetFailHandoffForTests();
  clearQaProgressFreeze();
  resetQaMessageRttForTests();
  clearQaAgentPresence();
  clearAgentTestingFinaleSeal();
  resetOriginProbeForTests();
  resetStaleGreenForTests();

  const out: QaSelfTestSmokeResult["checks"] = [];

  setSessionKind("observe");
  out.push(
    check(
      "observe-open-capture",
      getSessionKind() === "observe",
      "sessionKind observe"
    )
  );

  const escalated = escalateObserveToAgent();
  out.push(
    check(
      "observe-alarm-escalate",
      escalated && getSessionKind() === "agent",
      "escalateObserveToAgent"
    )
  );

  const unlocked = unlockAgentToObserve();
  out.push(
    check(
      "observe-unlock",
      unlocked && getSessionKind() === "observe",
      "unlockAgentToObserve"
    )
  );

  out.push(
    check(
      "handoff-wipe-clears-note",
      shouldWipeOnHandoff({}) === true &&
        shouldWipeOnHandoff({ oversee: false }) === true,
      "shouldWipeOnHandoff"
    )
  );
  out.push(
    check(
      "handoff-oversee-keeps-note",
      shouldWipeOnHandoff({ oversee: true }) === false &&
        resolveHandoffKind({ oversee: true, kind: "observe" }) === "observe",
      "oversee keep + kind"
    )
  );

  // --- recently shipped trust (pure) ---
  beginFailHandoff({
    reason: "self-test",
    pause: () => undefined,
    log: () => undefined,
  });
  setQaProgressFreeze("fail-handoff:self-test");
  const frozen = isQaProgressFrozen();
  const blocked = shouldBlockQaPlay({
    overlayActive: true,
    capturePaused: true,
    diagnosticOpen: false,
    progressFrozen: true,
  });
  out.push(
    check(
      "fail-handoff-freeze",
      frozen && blocked,
      `frozen=${frozen} block=${blocked}`
    )
  );
  confirmAgentFailTakeover({ source: "self-test", log: () => undefined });
  clearQaProgressFreeze();
  clearFailHandoff();
  out.push(
    check(
      "fail-handoff-unfreeze",
      isQaProgressFrozen() === false,
      "freeze lifted after clear"
    )
  );

  touchQaAgentPresence("self-test");
  const presence = peekQaAgentPresence();
  const controlLabel = formatMcpStatusLabel("control");
  out.push(
    check(
      "presence-online-linked",
      presence.online &&
        /ONLINE/i.test(presence.label) &&
        /ONLINE/i.test(controlLabel),
      presence.label || controlLabel
    )
  );

  noteQaMessageSent(1_000);
  const rtt = noteQaMessageConsumed(1_250);
  const floor = messageAwarePendingFloorMs(1_000);
  out.push(
    check(
      "message-rtt-helpers",
      rtt === 250 &&
        getQaMessageRttStats().lastRttMs === 250 &&
        floor >= 1_000,
      `rtt=${rtt} floor=${floor}`
    )
  );

  const stepped = deriveAgentControlKind({
    sessionKind: "agent",
    cjmOn: true,
    isPlaying: false,
  });
  const playback = deriveAgentControlKind({
    sessionKind: "agent",
    cjmOn: true,
    isPlaying: true,
  });
  out.push(
    check(
      "control-kind-stepped-vs-playback",
      stepped === "stepped" &&
        playback === "playback" &&
        formatAgentControlKindSuffix("stepped").includes("STEPPED") &&
        formatAgentControlKindSuffix("playback").includes("PLAYBACK"),
      `stepped=${stepped} playback=${playback}`
    )
  );

  sealAgentTestingFinale();
  out.push(
    check(
      "result-finale-seal",
      isAgentTestingFinaleSealed() === true,
      "sealed after RESULT"
    )
  );
  clearAgentTestingFinaleSeal();

  const host = formatOriginHostLabel({
    hostname: "127.0.0.1",
    port: "5173",
    protocol: "http:",
  });
  out.push(
    check(
      "session-origin-active",
      host === "Localhost:5173" &&
        formatOriginSessionLine("active", host) ===
          "Localhost:5173 · Active",
      host
    )
  );

  if (typeof document !== "undefined") {
    // HARD: never wipe `document.body.innerHTML` — that destroys the React Studio
    // root and leaves URL/screen hosts dead for every following QA suite step.
    const sandbox = document.createElement("div");
    sandbox.setAttribute("data-studio-qa-self-test-sandbox", "true");
    sandbox.style.cssText =
      "position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none;opacity:0";
    sandbox.innerHTML = `
      <div class="studio-nav-panel">
        <div class="studio-nav-status-bar"><p class="studio-nav-status-bar__title">PLP</p></div>
        <button data-studio-action="play">Play</button>
      </div>`;
    document.body.appendChild(sandbox);
    try {
      const empty = buildClickDetail(
        sandbox.querySelector(".studio-nav-status-bar")!
      );
      const btn = buildClickDetail(sandbox.querySelector("button")!);
      out.push(
        check(
          "control-room-interactive-only",
          empty === null &&
            btn?.surface === "control-room" &&
            /Control room: Play/i.test(btn?.label || ""),
          `empty=${empty} btn=${btn?.label}`
        )
      );
    } finally {
      sandbox.remove();
    }
  } else {
    out.push(
      check(
        "control-room-interactive-only",
        true,
        "skipped — no document (node)"
      )
    );
  }

  // pause-stops-capture is behavioral (isCapturing gate) — pure contract:
  out.push(
    check(
      "pause-stops-capture",
      shouldBlockQaPlay({
        overlayActive: true,
        capturePaused: true,
        diagnosticOpen: false,
      }) === true,
      "capturePaused blocks play (capture watch shares pause gate)"
    )
  );

  out.push(
    check(
      "stale-green-detect",
      Array.isArray(detectStaleGreenMismatches("?screen=chat")),
      "detector callable"
    )
  );

  out.push(
    check(
      "diag-mirror-rows",
      Array.isArray(getDiagMirrorRows(3)),
      "mirror rows callable"
    )
  );

  out.push(
    check(
      "catalog",
      QA_SELF_TEST_SCENARIOS.length >= 20,
      `${QA_SELF_TEST_SCENARIOS.length} scenarios`
    )
  );

  resetQaSessionForTests();
  resetFailHandoffForTests();
  clearQaProgressFreeze();
  resetQaMessageRttForTests();
  clearQaAgentPresence();
  clearAgentTestingFinaleSeal();
  resetOriginProbeForTests();
  resetStaleGreenForTests();
  return out;
}

/**
 * Browser smoke: pure checks + optional DOM probe when overlay APIs exist.
 * Does not replace full SELF_TEST.md marathon — gates trust-breakers only.
 * Uses QA_SELF_TEST_*_MS pacing (override via window.__studioQaSelfTestPaceMs).
 */
export async function runQaSelfTestSmoke(): Promise<QaSelfTestSmokeResult> {
  const checks = runQaSelfTestPureChecks();
  const pace = readPaceOverrides();

  if (typeof window !== "undefined") {
    const w = window as Window & {
      __studioForceClearAgentTestingOverlay?: () => void;
      __studioOpenQaLogger?: (opts?: { kind?: string }) => void;
      __studioQaSessionKind?: () => string;
      __studioGetQaSuiteStatus?: () => unknown;
      __studioMcpConnectionStatus?: () => { phase?: string; label?: string };
      __studioAgentTestingOverlay?: {
        ringAlarm?: (n?: string) => void;
        unlockObserve?: () => boolean;
        appendFinale?: (result: "pass" | "fail", summary?: string) => boolean;
        isCapturePaused?: () => boolean;
      };
      __studioPeekPoSignal?: () => { code?: string; type?: string } | null;
      __studioConsumePoSignal?: () => { code?: string } | null;
      __studioAppendPoNote?: (t: string) => boolean;
      __studioToggleQaLogger?: () => void;
      __studioBeginQaFailHandoff?: (r: string) => void;
      __studioConfirmFailTakeover?: () => boolean;
      __studioIsQaProgressFrozen?: () => boolean;
    };

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    try {
      // R16 — quiet suite helpers must not be touch-wrapped (CI + runtime dig).
      const armAudit = auditQuietHelpersNotTouchWrapped(
        w as Window & Record<string, unknown>
      );
      checks.push(
        check(
          "suite-helpers-not-touch-wrapped",
          armAudit.ok,
          armAudit.ok
            ? "quiet suite helpers unarmed"
            : `armed=${armAudit.armed.join(",")} · ${QA_SUITE_TOUCH_WRAP_DIG}`
        )
      );

      // Prior suite step (mcp-sanity) may still be settling / have a deferred
      // ensureClear. Wipe hard + wait until DOM is gone before Observe open.
      for (let i = 0; i < 8; i++) {
        w.__studioForceClearAgentTestingOverlay?.();
        try {
          w.__studioConsumePoSignal?.();
        } catch {
          /* hang-safe */
        }
        await sleep(pace.clear);
        const still =
          document.getElementById("agent-testing-overlay") != null ||
          w.__studioQaSessionKind?.() === "agent";
        if (!still) break;
      }

      // R16 — status poll must not re-arm CONTROL after wipe (the original crack).
      const kindBeforePoll = w.__studioQaSessionKind?.();
      for (let i = 0; i < 20; i++) {
        w.__studioGetQaSuiteStatus?.();
      }
      await sleep(80);
      const kindAfterPoll = w.__studioQaSessionKind?.();
      const overlayAfterPoll =
        document.getElementById("agent-testing-overlay") != null;
      const pollClean = kindAfterPoll !== "agent" && !overlayAfterPoll;
      checks.push(
        check(
          "suite-status-poll-no-rearm",
          pollClean,
          pollClean
            ? "GetQaSuiteStatus poll stayed quiet"
            : `kindBefore=${kindBeforePoll} kindAfter=${kindAfterPoll} overlay=${overlayAfterPoll} · ${QA_SUITE_TOUCH_WRAP_DIG}`
        )
      );

      w.__studioOpenQaLogger?.({ kind: "observe" });
      await sleep(pace.settle);
      // One retry if sanity settle raced Observe open into CONTROL.
      if (w.__studioQaSessionKind?.() !== "observe") {
        w.__studioForceClearAgentTestingOverlay?.();
        await sleep(pace.clear);
        w.__studioOpenQaLogger?.({ kind: "observe" });
        await sleep(pace.settle);
      }
      const kind = w.__studioQaSessionKind?.();
      const phase = w.__studioMcpConnectionStatus?.()?.phase;
      const observeOk =
        kind === "observe" && (phase === "observe" || phase === "connected");
      checks.push(
        check(
          "dom-observe-open",
          observeOk,
          observeOk
            ? `kind=${kind} phase=${phase}`
            : `kind=${kind} phase=${phase} · ${QA_SUITE_TOUCH_WRAP_DIG}`
        )
      );

      await sleep(pace.step);
      w.__studioAgentTestingOverlay?.ringAlarm?.("self-test");
      await sleep(pace.step);
      const latch =
        w.__studioPeekPoSignal?.() ??
        (window as Window & { __studioAgentTestingTakeover?: { code?: string } })
          .__studioAgentTestingTakeover;
      checks.push(
        check(
          "dom-observe-alarm",
          w.__studioQaSessionKind?.() === "agent" &&
            latch?.code === "ALARM_SEQUENCE_MISMATCH",
          latch?.code
        )
      );

      // Fail-handoff freeze still active after alarm path — confirm lifts it.
      const frozenDuring =
        w.__studioIsQaProgressFrozen?.() === true ||
        /Handing off/i.test(
          document.querySelector(".studio-agent-testing-overlay__log")
            ?.innerText || ""
        );
      const confirmed = w.__studioConfirmFailTakeover?.();
      await sleep(pace.step);
      const frozenAfter = w.__studioIsQaProgressFrozen?.() === true;
      checks.push(
        check(
          "dom-fail-handoff-freeze",
          frozenDuring === true &&
            confirmed === true &&
            frozenAfter === false,
          `during=${frozenDuring} confirmed=${confirmed} after=${frozenAfter}`
        )
      );

      const mcpLabel = w.__studioMcpConnectionStatus?.()?.label || "";
      checks.push(
        check(
          "dom-presence-online",
          /ONLINE/i.test(mcpLabel) || /CONTROL/i.test(mcpLabel),
          mcpLabel.slice(0, 80)
        )
      );

      w.__studioConsumePoSignal?.();
      await sleep(pace.step);

      // Message latch withholds RESULT
      w.__studioAppendPoNote?.("self-test withhold result");
      await sleep(pace.step);
      const withheld = w.__studioAgentTestingOverlay?.appendFinale?.(
        "pass",
        "should withhold"
      );
      checks.push(
        check(
          "dom-message-withholds-result",
          withheld === false,
          `appendFinale=${withheld}`
        )
      );
      w.__studioConsumePoSignal?.();
      await sleep(pace.step);

      const sessionLine =
        document.querySelector(".studio-agent-testing-overlay__session-line")
          ?.textContent || "";
      checks.push(
        check(
          "dom-session-origin",
          /Localhost:\d+\s*·\s*(Active|Checking|Offline)/i.test(
            sessionLine
          ),
          sessionLine.slice(0, 60)
        )
      );

      const mirror = document.querySelector(
        ".studio-agent-testing-overlay__diag-mirror"
      );
      checks.push(
        check("dom-diag-mirror", !!mirror, mirror ? "present" : "missing")
      );

      const unlocked = w.__studioAgentTestingOverlay?.unlockObserve?.();
      await sleep(pace.step);
      checks.push(
        check(
          "dom-unlock",
          unlocked === true && w.__studioQaSessionKind?.() === "observe",
          `unlocked=${unlocked}`
        )
      );

      const empty = w.__studioAppendPoNote?.("   ");
      checks.push(check("empty-message-noop", empty === false, String(empty)));

      await sleep(pace.step);
      w.__studioToggleQaLogger?.();
      await sleep(pace.step);
      checks.push(
        check(
          "bug-toggle-observe-noop",
          w.__studioQaSessionKind?.() === "observe" &&
            document.getElementById("agent-testing-overlay")?.dataset
              ?.active === "true",
          "bug toggle must not close observe"
        )
      );

      const passed = checks.filter((c) => c.ok).length;
      const failed = checks.length - passed;
      const finaleOk = failed === 0;
      const totalWithFinaleAssertion = checks.length + 1;
      const passedWithFinaleAssertion = passed + 1;
      w.__studioAgentTestingOverlay?.appendFinale?.(
        finaleOk ? "pass" : "fail",
        `${passedWithFinaleAssertion}/${totalWithFinaleAssertion} checks`
      );
      await sleep(pace.step);
      const finaleLine = [
        ...document.querySelectorAll(
          ".studio-agent-testing-overlay__log li"
        ),
      ]
        .map((li) => li.textContent || "")
        .find((t) => /RESULT · (PASS|FAIL)/.test(t));
      checks.push(
        check(
          "session-finale-line",
          !!finaleLine &&
            (finaleOk
              ? /RESULT · PASS/.test(finaleLine)
              : /RESULT · FAIL/.test(finaleLine)),
          finaleLine?.slice(0, 80)
        )
      );
    } catch (err) {
      checks.push(
        check("dom-smoke", false, err instanceof Error ? err.message : "error")
      );
    } finally {
      try {
        (
          w as Window & {
            __studioClearStalePlaybackDiagnostic?: (s?: string) => boolean;
          }
        ).__studioClearStalePlaybackDiagnostic?.("self-test-end");
      } catch {
        /* hang-safe */
      }
      try {
        w.__studioForceClearAgentTestingOverlay?.();
      } catch {
        /* hang-safe */
      }
    }
  }

  return {
    ok: checks.every((c) => c.ok),
    atIso: new Date().toISOString(),
    scenarioCount: checks.length,
    catalogScenarioCount: QA_SELF_TEST_SCENARIOS.length,
    paceMs: pace,
    checks,
  };
}

function readPaceOverrides(): {
  step: number;
  settle: number;
  clear: number;
} {
  const defaults = {
    step: QA_SELF_TEST_STEP_MS,
    settle: QA_SELF_TEST_SETTLE_MS,
    clear: QA_SELF_TEST_CLEAR_MS,
  };
  if (typeof window === "undefined") return defaults;
  const raw = (
    window as Window & {
      __studioQaSelfTestPaceMs?: Partial<typeof defaults>;
    }
  ).__studioQaSelfTestPaceMs;
  if (!raw || typeof raw !== "object") return defaults;
  const clamp = (n: unknown, fallback: number) =>
    typeof n === "number" && Number.isFinite(n) && n >= 0
      ? Math.round(n)
      : fallback;
  return {
    step: clamp(raw.step, defaults.step),
    settle: clamp(raw.settle, defaults.settle),
    clear: clamp(raw.clear, defaults.clear),
  };
}
