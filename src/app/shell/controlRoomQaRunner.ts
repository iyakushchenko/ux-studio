import {
  logQaCheck,
  logQaPhase,
  publishQaHud,
  resetQaHud,
} from "@/app/shell/controlPanelQa";
import {
  checkBookStep2DwellCursorViolations,
  disableCursorQaEyes,
  enableCursorQaEyes,
  getPlaybackCursorSummary,
  isBookStep2BeatId,
  isBookStep2DwellBeatId,
  logCursorQaSummary,
} from "@/app/shell/playbackCursorDiagnostic";
import { parseStudioStepCounter } from "@/app/shell/studioMcpHelpers";

const CONTROL_ROOM_TAP_MS = 300;

export type ControlRoomQaCheck = {
  id: string;
  pass: boolean;
  detail?: string;
};

export type ControlRoomQaResult = {
  pass: boolean;
  checks: ControlRoomQaCheck[];
  finalCounter: string | null;
};

const TRANSPORT_LABELS = {
  "step-forward": "Step forward",
  "step-back": "Step back",
  play: "Play journey",
  "jump-to-start": "Jump to start",
} as const;

type TransportAction = keyof typeof TRANSPORT_LABELS;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function readState() {
  return window.__protoStudioState?.();
}

function publishCursorEyes(detail: string): void {
  const state = readState();
  publishQaHud({
    detail: state?.lastCursor ? `${detail} · ⌖ ${state.lastCursor}` : detail,
  });
}

function recordCursorTelemetry(id: string): void {
  const state = readState();
  const unexpected = state?.cursorUnexpectedOnDwell ?? 0;
  const events = state?.cursorEventCount ?? 0;
  const summary = state?.lastCursor ?? "none";
  logQaCheck(id, unexpected === 0, {
    unexpected,
    events,
    lastCursor: summary,
    beatId: state?.beatId,
  });
}

function counterStep(counter: string | null | undefined): number | null {
  return parseStudioStepCounter(counter ?? null).visible;
}

function isOnAir(): boolean {
  return document.querySelector(".studio-nav-scenario--on-air") != null;
}

function hoverCounter(): void {
  document
    .querySelector(".studio-nav-scenario__counter")
    ?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
}

async function waitTransportIdle(
  direction: "forward" | "back" | "any" = "any",
  timeoutMs = 35000
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = readState();
    if (state?.diagnosticOpen) return false;
    if (isOnAir()) {
      await delay(200);
      continue;
    }
    const fwd = document.querySelector('[aria-label="Step forward"]');
    const back = document.querySelector('[aria-label="Step back"]');
    const play = document.querySelector('[aria-label="Play journey"]');
    if (direction === "forward" && fwd && !fwd.hasAttribute("disabled")) {
      return true;
    }
    if (direction === "back" && back && !back.hasAttribute("disabled")) {
      return true;
    }
    if (direction === "any" && (fwd || back || play)) {
      return true;
    }
    await delay(200);
  }
  return false;
}

async function clickTransport(action: TransportAction): Promise<boolean> {
  const btn = document.querySelector(
    `[aria-label="${TRANSPORT_LABELS[action]}"]`
  ) as HTMLButtonElement | null;
  if (!btn || btn.disabled) return false;
  btn.click();
  hoverCounter();
  await delay(CONTROL_ROOM_TAP_MS);
  return true;
}

async function clickUntilIdle(
  action: "step-forward" | "step-back",
  maxClicks: number
): Promise<{ clicks: number; lastCounter: string | null }> {
  let clicks = 0;
  let lastCounter = readState()?.counter ?? null;
  let dwellCursorSeq = 0;
  for (let i = 0; i < maxClicks; i++) {
    const ready = await waitTransportIdle(
      action === "step-forward" ? "forward" : "back"
    );
    if (!ready) break;
    const btn = document.querySelector(
      `[aria-label="${TRANSPORT_LABELS[action]}"]`
    ) as HTMLButtonElement | null;
    if (!btn || btn.disabled) break;
    const before = readState()?.counter ?? null;
    const beforeBeatId = readState()?.beatId ?? null;
    if (isBookStep2DwellBeatId(beforeBeatId)) {
      dwellCursorSeq = getPlaybackCursorSummary().last?.seq ?? dwellCursorSeq;
    }
    btn.click();
    hoverCounter();
    clicks += 1;
    const deadline = Date.now() + 35000;
    while (Date.now() < deadline) {
      await delay(200);
      const state = readState();
      if (state?.diagnosticOpen) break;
      if (!isOnAir() && state?.counter !== before) {
        lastCounter = state?.counter ?? null;
        logQaCheck(`${action}-${clicks}`, true, {
          before,
          after: state?.counter,
          beatId: state?.beatId,
        });
        logCursorQaSummary(`${action}-${clicks}`, state?.beatId);
        if (isBookStep2DwellBeatId(beforeBeatId)) {
          const dwellCheck = checkBookStep2DwellCursorViolations(dwellCursorSeq);
          logQaCheck("book-step2-dwell-no-travel", dwellCheck.pass, {
            beatId: beforeBeatId,
            violations: dwellCheck.violations.map((v) => v.action),
          });
        }
        if (
          isBookStep2BeatId(state?.beatId) &&
          !isBookStep2DwellBeatId(state?.beatId) &&
          getPlaybackCursorSummary().count === 0
        ) {
          logQaCheck("book-step2-script-cursor-visible", false, {
            beatId: state?.beatId,
          });
        }
        break;
      }
    }
    await delay(400);
  }
  return { clicks, lastCounter };
}

async function stepBackToStart(
  maxClicks = 30
): Promise<{ clicks: number; lastCounter: string | null }> {
  let clicks = 0;
  let lastCounter = readState()?.counter ?? null;
  let dwellCursorSeq = 0;

  for (let i = 0; i < maxClicks; i++) {
    const state = readState();
    if (state?.diagnosticOpen) break;
    if (counterStep(state?.counter) === 1) break;

    const ready = await waitTransportIdle("back");
    if (!ready) break;
    const btn = document.querySelector(
      `[aria-label="${TRANSPORT_LABELS["step-back"]}"]`
    ) as HTMLButtonElement | null;
    if (!btn || btn.disabled) break;

    const before = state?.counter ?? null;
    const beforeBeatId = state?.beatId ?? null;
    if (isBookStep2DwellBeatId(beforeBeatId)) {
      dwellCursorSeq = getPlaybackCursorSummary().last?.seq ?? dwellCursorSeq;
    }

    btn.click();
    hoverCounter();
    clicks += 1;

    const deadline = Date.now() + 35000;
    let progressed = false;
    while (Date.now() < deadline) {
      await delay(200);
      const after = readState();
      if (after?.diagnosticOpen) break;
      const beforeStep = counterStep(before);
      const afterStep = counterStep(after?.counter ?? null);
      const counterRetreated =
        beforeStep != null &&
        afterStep != null &&
        afterStep < beforeStep;
      if (
        !isOnAir() &&
        (after?.counter !== before ||
          counterRetreated ||
          after?.beatId !== beforeBeatId)
      ) {
        lastCounter = after?.counter ?? null;
        logQaCheck(`step-back-${clicks}`, true, {
          before,
          after: after?.counter,
          beatId: after?.beatId,
        });
        logCursorQaSummary(`step-back-${clicks}`, after?.beatId);
        if (isBookStep2DwellBeatId(beforeBeatId)) {
          const dwellCheck = checkBookStep2DwellCursorViolations(dwellCursorSeq);
          logQaCheck("book-step2-dwell-no-travel", dwellCheck.pass, {
            beatId: beforeBeatId,
            violations: dwellCheck.violations.map((v) => v.action),
          });
        }
        progressed = true;
        break;
      }
    }
    if (!progressed) break;
    await delay(400);
  }

  return { clicks, lastCounter };
}

function hasVisibleBookStep2Overlay(): boolean {
  return Boolean(
    document.querySelector(
      ".proto-avail-card, .proto-login-card, .proto-vaccine-picker-card, .proto-recipient-picker-card, .proto-quick-view-card"
    )
  );
}

async function stepToBeatAndAssertNoPopup(
  beatId: string,
  maxSteps: number
): Promise<ControlRoomQaCheck> {
  await clickTransport("jump-to-start");
  await delay(500);

  for (let i = 0; i < maxSteps; i++) {
    const ready = await waitTransportIdle("forward");
    if (!ready) break;
    const before = readState();
    if (before?.beatId === beatId) {
      const strayPopup = hasVisibleBookStep2Overlay();
      return {
        id: `${beatId}-no-stray-popup`,
        pass: !strayPopup,
        detail: strayPopup ? "overlay visible on Book Step 2" : before?.counter ?? "",
      };
    }
    if (!(await clickTransport("step-forward"))) break;
    await delay(600);
    const after = readState();
    if (after?.beatId === beatId && !isOnAir()) {
      const strayPopup = hasVisibleBookStep2Overlay();
      return {
        id: `${beatId}-no-stray-popup`,
        pass: !strayPopup,
        detail: strayPopup ? "overlay visible on Book Step 2" : after?.counter ?? "",
      };
    }
  }

  return {
    id: `${beatId}-no-stray-popup`,
    pass: false,
    detail: `did not reach ${beatId}`,
  };
}

/** Autonomous Traditional CJM control-room QA — real button clicks + HUD telemetry. */
export async function runTraditionalControlRoomRobotQa(): Promise<ControlRoomQaResult> {
  const checks: ControlRoomQaCheck[] = [];
  const record = (id: string, pass: boolean, detail?: string) => {
    checks.push({ id, pass, detail });
    logQaCheck(id, pass, detail ? { detail } : undefined);
  };

  resetQaHud();
  enableCursorQaEyes();
  publishQaHud({ running: true, phase: "boot", detail: "clean studio · cursor eyes on" });
  window.__protoEnsureCleanStudio?.();

  logQaPhase("setup", "traditional + journey");
  if (window.__protoSetOrchestraMode?.("traditional-cjm") === false) {
    record("orchestra-traditional", false, "set failed");
  } else {
    record("orchestra-traditional", true);
  }
  if (window.__protoSetJourneyMode?.(true) === false) {
    record("journey-on", false, "set failed");
  } else {
    record("journey-on", true);
  }
  await delay(600);
  const start = readState();
  record("start-plp", counterStep(start?.counter) === 1, start?.counter ?? "");

  logQaPhase("book-step2", "no stray popup · cursor dwell");
  publishQaHud({ detail: "book step 2 popup + cursor check" });
  const bookStep2Popup = await stepToBeatAndAssertNoPopup("book-step2", 12);
  record(bookStep2Popup.id, bookStep2Popup.pass, bookStep2Popup.detail);
  await delay(1200);
  recordCursorTelemetry("book-step2-dwell-cursor");
  publishCursorEyes("book-step2 dwell");

  logQaPhase("step-forward", "full matrix");
  publishQaHud({ detail: "step forward" });
  const fwd = await clickUntilIdle("step-forward", 20);
  record(
    "step-forward-reached-end",
    (counterStep(fwd.lastCounter) ?? 0) >= 10,
    fwd.lastCounter ?? ""
  );
  recordCursorTelemetry("step-forward-cursor");
  publishCursorEyes("step-forward done");

  logQaPhase("step-back", "full retreat");
  publishQaHud({ detail: "step back" });
  const back = await stepBackToStart(30);
  record(
    "step-back-at-start",
    counterStep(back.lastCounter) === 1,
    back.lastCounter ?? ""
  );
  recordCursorTelemetry("step-back-cursor");
  publishCursorEyes("step-back done");

  logQaPhase("play-pause", "mid-playback");
  publishQaHud({ detail: "play · pause · resume" });
  await waitTransportIdle("any");
  await clickTransport("jump-to-start");
  await waitTransportIdle("any");
  await delay(400);
  if (!(await clickTransport("play"))) {
    record("play-start", false, "play disabled");
  } else {
    record("play-start", true);
    const playDeadline = Date.now() + 30000;
    let mid = readState();
    while (Date.now() < playDeadline) {
      await delay(300);
      mid = readState();
      if (mid?.diagnosticOpen) break;
      if (!isOnAir() && (counterStep(mid?.counter) ?? 0) >= 2) break;
    }
    const midStep = counterStep(mid?.counter) ?? 0;
    record("play-advanced", midStep >= 2, mid?.counter ?? "");
    await waitTransportIdle("any");
    mid = readState();
    const frozenCounter = mid?.counter;
    const frozenStep = counterStep(frozenCounter) ?? 0;
    if (await clickTransport("play")) {
      await delay(300);
      const pausedOnAir = isOnAir();
      await delay(2000);
      const afterPause = readState();
      record(
        "pause-holds",
        !isOnAir() && afterPause?.counter === frozenCounter,
        `onAir=${pausedOnAir} counter=${afterPause?.counter}`
      );
      if (await clickTransport("play")) {
        const resumeDeadline = Date.now() + 20000;
        let resumedCounter = readState()?.counter ?? frozenCounter;
        while (Date.now() < resumeDeadline) {
          await delay(300);
          const state = readState();
          if (state?.diagnosticOpen) break;
          resumedCounter = state?.counter ?? resumedCounter;
          if (!isOnAir() && (counterStep(resumedCounter) ?? 0) > frozenStep) break;
        }
        record(
          "resume-advances",
          (counterStep(resumedCounter) ?? 0) > frozenStep,
          resumedCounter ?? ""
        );
        if (isOnAir()) {
          await clickTransport("play");
        }
      }
    }
  }

  logQaPhase("play-through", "to end");
  publishQaHud({ detail: "play to end" });
  window.__protoDismissPlaybackDiagnostic?.();
  await delay(200);
  await waitTransportIdle("any");
  await clickTransport("jump-to-start");
  await delay(400);
  if (await clickTransport("play")) {
    const deadline = Date.now() + 120000;
    let reachedEnd = false;
    while (Date.now() < deadline) {
      await delay(500);
      const state = readState();
      if (state?.diagnosticOpen) break;
      const step = counterStep(state?.counter);
      const total = parseStudioStepCounter(state?.counter ?? null).total;
      if (step != null && total && step >= total && !isOnAir()) {
        reachedEnd = true;
        record("play-to-end", true, state?.counter ?? "");
        break;
      }
    }
    if (!reachedEnd) {
      record("play-to-end", false, readState()?.counter ?? "timeout");
    }
  }

  const final = readState();
  recordCursorTelemetry("final-cursor-telemetry");
  record(
    "cursor-eyes-active",
    (final?.cursorEventCount ?? 0) > 0,
    `events=${final?.cursorEventCount ?? 0} last=${final?.lastCursor ?? "none"}`
  );
  const pass = checks.every((c) => c.pass) && !final?.diagnosticOpen;
  logQaPhase(
    pass ? "done-pass" : "done-fail",
    `${checks.filter((c) => c.pass).length}/${checks.length}`
  );
  publishQaHud({ running: false, phase: pass ? "pass" : "fail" });
  disableCursorQaEyes();

  return {
    pass,
    checks,
    finalCounter: final?.counter ?? null,
  };
}

declare global {
  interface Window {
    __protoRunTraditionalControlRoomRobotQa?: () => Promise<ControlRoomQaResult>;
  }
}
