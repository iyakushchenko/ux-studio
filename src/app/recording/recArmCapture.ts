/**
 * Honest REC arm — typical-user UI path ONLY.
 *
 * 1) CJM off (click switch) → 2) click nav REC switch ON → 3) CREATE NEW (menu)
 * → 4) click ● Start. FAIL unless DOM shows REC on + CREATE NEW + live session.
 *
 * Hooks (setRecMode) are last-resort only after a real switch click failed.
 */

import { selectCreateNewCjm } from "@/app/recording/createNewCjmApi";
import {
  isRecordingActive,
  isRecordingPaused,
} from "@/app/recording/recordingSession";
import {
  isStudioPlaybackPanelVisible,
  isStudioRecModeOnInDom,
  readStudioRecSwitch,
} from "@/app/recording/studioRecModeDom";
import { logAgentTestingStep } from "@/app/shell/agent-testing";
import { requireFreshQaSession } from "@/app/shell/requireFreshQaSession";

export type RecLiveAssert = {
  ok: boolean;
  recMode: boolean;
  recording: boolean;
  createNew: boolean;
  startVisible: boolean;
  overlayRecLive: boolean;
  playbackPanel: boolean;
  reason?: string;
};

export type ArmRecCaptureResult = RecLiveAssert & {
  sessionId?: string;
  /** How REC mode was turned on — for honesty in prove logs. */
  recModeVia?: "dom-click" | "hook-fallback" | "already-on" | "failed";
};

export type RecArmCaptureHooks = {
  setJourneyMode: (enabled: boolean) => void;
  setRecMode: (enabled: boolean) => void;
  getStartOptions?: () => import("@/app/recording/recordingSession").StartRecordingOptions;
  settleMs?: number;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isCreateNewSelectedInDom(): boolean {
  // Project/Persona/Orchestra share .studio-nav-journey-menu — find Orchestra.
  const menus = Array.from(
    document.querySelectorAll<HTMLElement>(".studio-nav-journey-menu")
  );
  for (const menu of menus) {
    if (menu.hasAttribute("data-studio-new-cjm")) return true;
    if (menu.classList.contains("studio-nav-journey-menu--new-cjm")) return true;
    const trigger = menu.querySelector<HTMLElement>(
      ".studio-nav-journey-menu__trigger"
    );
    const text = (trigger?.textContent ?? "").toUpperCase();
    if (text.includes("CREATE NEW") || text.includes("NEW CJM")) return true;
  }
  return false;
}

function startRecordingButton(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(
    'button[aria-label="Start recording"], button[data-studio-recording-start]'
  );
}

function stopRecordingButton(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(
    'button[aria-label="Stop recording"], button[data-studio-recording-stop]'
  );
}

function overlayRecLive(): boolean {
  const root = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay, [data-studio-agent-testing]"
  );
  if (!root) return false;
  return root.getAttribute("data-rec") === "live";
}

function isCjmOnInDom(): boolean {
  const sw = document.querySelector<HTMLElement>(
    '[role="switch"][aria-label="CJM"]'
  );
  return sw?.getAttribute("aria-checked") === "true";
}

function clickCjmOff(): boolean {
  const sw = document.querySelector<HTMLButtonElement>(
    '[role="switch"][aria-label="CJM"]'
  );
  if (!sw || sw.getAttribute("aria-checked") !== "true") return false;
  if (sw.disabled) return false;
  sw.click();
  return true;
}

/** Open orchestra menu and pick CREATE NEW CJM (real option click). */
async function pickCreateNewCjmViaUi(settle: number): Promise<{
  ok: boolean;
  via: "already" | "menu-click" | "imperative" | "failed";
  detail?: string;
}> {
  if (isCreateNewSelectedInDom()) {
    return { ok: true, via: "already" };
  }

  // Project / Persona / Orchestra all share .studio-nav-journey-menu — find Orchestra.
  const menus = Array.from(
    document.querySelectorAll<HTMLElement>(".studio-nav-journey-menu")
  );
  let orchestraTrigger: HTMLButtonElement | null = null;
  let optionLabels: string[] = [];

  for (const menu of menus) {
    const trigger = menu.querySelector<HTMLButtonElement>(
      ".studio-nav-journey-menu__trigger"
    );
    if (!trigger || trigger.disabled) continue;
    if (trigger.getAttribute("aria-expanded") !== "true") {
      trigger.click();
      await delay(settle);
    }
    const panel = menu.querySelector<HTMLElement>('[role="listbox"]');
    const label = panel?.getAttribute("aria-label") ?? "";
    const options = Array.from(
      menu.querySelectorAll<HTMLButtonElement>('[role="option"]')
    );
    const labels = options.map((o) => (o.textContent ?? "").trim());
    if (label === "Orchestra mode" || labels.some((t) => /CREATE\s*NEW/i.test(t))) {
      orchestraTrigger = trigger;
      optionLabels = labels;
      const createNew = options.find((el) =>
        /CREATE\s*NEW/i.test((el.textContent ?? "").trim())
      );
      if (createNew) {
        createNew.click();
        await delay(settle);
        if (isCreateNewSelectedInDom()) {
          return { ok: true, via: "menu-click" };
        }
      }
      // Close if still open and we failed to select
      if (trigger.getAttribute("aria-expanded") === "true") {
        trigger.click();
        await delay(settle / 2);
      }
      break;
    }
    // Wrong menu (Project/Persona) — close and continue
    if (trigger.getAttribute("aria-expanded") === "true") {
      trigger.click();
      await delay(settle / 2);
    }
  }

  // Last resort: same handler as picker CREATE NEW (not a silent REC start).
  if (selectCreateNewCjm()) {
    await delay(settle);
    if (isCreateNewSelectedInDom()) {
      return {
        ok: true,
        via: "imperative",
        detail: `menu options seen=${optionLabels.length}; fell back to CREATE NEW selector`,
      };
    }
  }
  return {
    ok: false,
    via: "failed",
    detail: `CREATE NEW option miss (orchestraTrigger=${Boolean(
      orchestraTrigger
    )}; options=${optionLabels.join(" | ") || "none"})`,
  };
}

/**
 * Truth latch — REC switch ON + live session + REC deck (not playback chrome).
 */
export function assertRecLive(): RecLiveAssert {
  const recMode = isStudioRecModeOnInDom();
  const recording = isRecordingActive() || isRecordingPaused();
  const createNew = isCreateNewSelectedInDom();
  const startVisible = startRecordingButton() != null;
  const overlay = overlayRecLive();
  const playbackPanel = isStudioPlaybackPanelVisible();
  if (!recMode) {
    return {
      ok: false,
      recMode,
      recording,
      createNew,
      startVisible,
      overlayRecLive: overlay,
      playbackPanel,
      reason: "REC switch not ON (aria-label=REC on + aria-checked=true)",
    };
  }
  if (playbackPanel) {
    return {
      ok: false,
      recMode,
      recording,
      createNew,
      startVisible,
      overlayRecLive: overlay,
      playbackPanel,
      reason: "playback panel still visible — nav not in REC mode chrome",
    };
  }
  if (!recording) {
    return {
      ok: false,
      recMode,
      recording,
      createNew,
      startVisible,
      overlayRecLive: overlay,
      playbackPanel,
      reason: "recording session not live (isRecordingActive/paused false)",
    };
  }
  return {
    ok: true,
    recMode,
    recording,
    createNew,
    startVisible,
    overlayRecLive: overlay,
    playbackPanel,
  };
}

/**
 * Arm REC the typical-user way: click REC switch → CREATE NEW → ● Start.
 * ALWAYS CLEAR QA first (code law — no skip).
 */
export async function armRecCapture(
  hooks: RecArmCaptureHooks
): Promise<ArmRecCaptureResult> {
  const settle = hooks.settleMs ?? 120;
  let recModeVia: ArmRecCaptureResult["recModeVia"] = "failed";

  // 0) UNSKIPPABLE — ALWAYS CLEAR QA then fresh visible session.
  const qa = requireFreshQaSession("AGENT TESTING — REC capture");
  if (!qa.ok) {
    const fail: ArmRecCaptureResult = {
      ok: false,
      recMode: isStudioRecModeOnInDom(),
      recording: false,
      createNew: false,
      startVisible: false,
      overlayRecLive: overlayRecLive(),
      playbackPanel: isStudioPlaybackPanelVisible(),
      reason: qa.reason ?? "QA ALWAYS CLEAR failed",
      recModeVia: "failed",
    };
    logArm(fail);
    return fail;
  }

  // 1) CJM off — real switch click (REC locked while CJM on).
  if (isCjmOnInDom()) {
    if (!clickCjmOff()) {
      hooks.setJourneyMode(false);
    }
    await delay(settle);
  }
  if (isCjmOnInDom()) {
    const fail: ArmRecCaptureResult = {
      ok: false,
      recMode: false,
      recording: false,
      createNew: false,
      startVisible: false,
      overlayRecLive: overlayRecLive(),
      playbackPanel: isStudioPlaybackPanelVisible(),
      reason: "BLOCKED — could not turn CJM off (REC locked while CJM on)",
      recModeVia: "failed",
    };
    logArm(fail);
    return fail;
  }

  // 2) Click nav REC switch (typical user) — required first.
  if (isStudioRecModeOnInDom()) {
    recModeVia = "already-on";
  } else {
    const recSwitch = readStudioRecSwitch();
    if (!recSwitch) {
      const fail: ArmRecCaptureResult = {
        ok: false,
        recMode: false,
        recording: false,
        createNew: false,
        startVisible: false,
        overlayRecLive: overlayRecLive(),
        playbackPanel: isStudioPlaybackPanelVisible(),
        reason:
          "BLOCKED — REC switch not found ([role=switch][aria-label=REC on|off])",
        recModeVia: "failed",
      };
      logArm(fail);
      return fail;
    }
    if (recSwitch.hasAttribute("disabled") || (recSwitch as HTMLButtonElement).disabled) {
      const fail: ArmRecCaptureResult = {
        ok: false,
        recMode: false,
        recording: false,
        createNew: false,
        startVisible: false,
        overlayRecLive: overlayRecLive(),
        playbackPanel: isStudioPlaybackPanelVisible(),
        reason: `BLOCKED — REC switch disabled (title=${recSwitch.getAttribute("title") ?? "?"})`,
        recModeVia: "failed",
      };
      logArm(fail);
      return fail;
    }
    recSwitch.click();
    await delay(settle);
    if (isStudioRecModeOnInDom()) {
      recModeVia = "dom-click";
    } else {
      // Last resort AFTER real click failed — report then try hook once.
      hooks.setRecMode(true);
      await delay(settle);
      if (isStudioRecModeOnInDom()) {
        recModeVia = "hook-fallback";
      } else {
        const fail: ArmRecCaptureResult = {
          ok: false,
          recMode: false,
          recording: false,
          createNew: false,
          startVisible: startRecordingButton() != null,
          overlayRecLive: overlayRecLive(),
          playbackPanel: isStudioPlaybackPanelVisible(),
          reason:
            "BLOCKED — REC switch click + setRecMode did not yield aria-label=REC on",
          recModeVia: "failed",
        };
        logArm(fail);
        return fail;
      }
    }
  }

  // 3) CREATE NEW via orchestra menu (real UI).
  const createPick = await pickCreateNewCjmViaUi(settle);
  if (!createPick.ok) {
    const fail: ArmRecCaptureResult = {
      ok: false,
      recMode: isStudioRecModeOnInDom(),
      recording: isRecordingActive(),
      createNew: false,
      startVisible: startRecordingButton() != null,
      overlayRecLive: overlayRecLive(),
      playbackPanel: isStudioPlaybackPanelVisible(),
      reason: `BLOCKED — CREATE NEW CJM not selectable (${createPick.detail ?? createPick.via})`,
      recModeVia,
    };
    logArm(fail);
    return fail;
  }

  // Hard: still must show REC on before Start.
  if (!isStudioRecModeOnInDom()) {
    const fail: ArmRecCaptureResult = {
      ok: false,
      recMode: false,
      recording: false,
      createNew: isCreateNewSelectedInDom(),
      startVisible: false,
      overlayRecLive: overlayRecLive(),
      playbackPanel: isStudioPlaybackPanelVisible(),
      reason: "BLOCKED — REC switch lost after CREATE NEW",
      recModeVia,
    };
    logArm(fail);
    return fail;
  }

  // 4) ● Start — real Start button only (no startRecording while chrome wrong).
  if (!(isRecordingActive() || isRecordingPaused())) {
    let startBtn = startRecordingButton();
    if (!startBtn || startBtn.disabled) {
      await delay(settle * 2);
      startBtn = startRecordingButton();
    }
    if (!startBtn) {
      const fail: ArmRecCaptureResult = {
        ok: false,
        recMode: true,
        recording: false,
        createNew: true,
        startVisible: false,
        overlayRecLive: overlayRecLive(),
        playbackPanel: isStudioPlaybackPanelVisible(),
        reason:
          "BLOCKED — Start recording button missing (REC deck not mounted)",
        recModeVia,
      };
      logArm(fail);
      return fail;
    }
    if (startBtn.disabled) {
      const fail: ArmRecCaptureResult = {
        ok: false,
        recMode: true,
        recording: false,
        createNew: true,
        startVisible: true,
        overlayRecLive: overlayRecLive(),
        playbackPanel: isStudioPlaybackPanelVisible(),
        reason: "BLOCKED — Start recording button disabled",
        recModeVia,
      };
      logArm(fail);
      return fail;
    }
    startBtn.click();
    await delay(settle);
  }

  const live = assertRecLive();
  if (live.ok) {
    const sessionId =
      (
        window as Window & {
          __protoGetRecording?: () => { id?: string } | null;
        }
      ).__protoGetRecording?.()?.id ?? undefined;
    const ok: ArmRecCaptureResult = { ...live, sessionId, recModeVia };
    logArm(ok);
    return ok;
  }
  logArm({ ...live, recModeVia });
  return { ...live, recModeVia };
}

/** Click ■ Stop on the REC deck (typical user). */
export async function stopRecCaptureViaUi(settleMs = 120): Promise<boolean> {
  const btn = stopRecordingButton();
  if (!btn || btn.disabled) return false;
  btn.click();
  await delay(settleMs);
  return !isRecordingActive();
}

function logArm(result: ArmRecCaptureResult): void {
  try {
    logAgentTestingStep({
      kind: "rec",
      action: "ArmRecCapture",
      label: result.ok
        ? `REC armed live · switch+session${result.sessionId ? ` · ${result.sessionId}` : ""}${result.recModeVia ? ` · via ${result.recModeVia}` : ""}`
        : `REC arm FAIL — ${result.reason ?? "not live"}`,
      outcome: result.ok ? "ok" : "fail",
    });
  } catch {
    /* hang-safe */
  }
}
