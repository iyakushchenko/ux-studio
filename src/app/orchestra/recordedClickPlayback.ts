import {
  resolveUsableDemoClickTarget,
} from "@/app/recording/recordingCapture";
import type { JourneyBeatRecordedClick } from "@/app/orchestra/types";
import {
  isClickableTarget,
  simulateDemoPointerClick,
} from "@/app/scenario/demoCursor";
import { scrollCameraToTarget } from "@/app/scenario/playbackScroll";
import {
  isBlockingModalOpen,
  resolveClickTargetRespectingModal,
} from "@/app/shell/studioModalGuard";
import {
  fromBool,
  scriptFail,
  type PlaybackScriptResult,
} from "@/projects/playbackScriptResult";
import { resolvePlaybackSelectorChain } from "@/app/recording/recordingCapture";
import { isDegradedClickTarget } from "@/app/recording/recordingLabels";
import { playbackDiagClick } from "@/app/shell/playbackDiag";
import {
  drainLoginModalIfOpen,
  isLoginModalOpenInDom,
} from "@/app/recording/recModalDrain";
import { isFastPlayback, playbackMs } from "@/app/shell/playbackTiming";

function resolveRecordedClickTarget(
  click: JourneyBeatRecordedClick
): HTMLElement | null {
  const resolved = resolvePlaybackSelectorChain(click.selectorChain, document);
  const modalResolved = resolveClickTargetRespectingModal(resolved, {
    resolveInModal: (modal) =>
      resolvePlaybackSelectorChain(click.selectorChain, modal),
  });
  return resolveUsableDemoClickTarget(modalResolved);
}

function isLoginRecordedAction(click: JourneyBeatRecordedClick | undefined): boolean {
  return Boolean(
    click &&
      (click.modalId === "login" ||
        click.selectorChain.some((selector) =>
          /data-studio-action=["']login-sign-in["']/.test(selector)
        ))
  );
}

/** React/filter updates may replace a matching node between resolve and click. */
async function waitForStableRecordedClickTarget(
  click: JourneyBeatRecordedClick
): Promise<HTMLElement | null> {
  let previous: HTMLElement | null = null;
  let stableSamples = 0;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidate = resolveRecordedClickTarget(click);
    if (candidate && isClickableTarget(candidate)) {
      stableSamples = candidate === previous ? stableSamples + 1 : 1;
      previous = candidate;
      if (stableSamples >= 3) return candidate;
    } else {
      previous = null;
      stableSamples = 0;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
}

/**
 * Compile v2 recordedClick Play.
 *
 * Traditional PDP Book Now while logged out opens login — REC often captures a
 * second Book Now after sign-in. Drain login (Sign in) before retry / after
 * click so continuous Play does not stall as target-degraded under the modal.
 * Does not auto-drain choose-pharmacy (own beat usually owns that pick).
 */
export async function playRecordedClick(
  click: JourneyBeatRecordedClick,
  options?: {
    skip?: boolean;
    /** Open blocking lightbox before resolving modal-scoped targets. */
    applyStudioModal?: (modalId: string | undefined) => void;
    /**
     * The next recorded beat owns the login CTA. Preserve its modal instead of
     * consuming the action early, so every recorded intent plays exactly once.
     */
    nextRecordedClick?: JourneyBeatRecordedClick;
  }
): Promise<PlaybackScriptResult> {
  if (options?.skip) return { ok: true };

  // Play must honor REC `&modal=` — open before resolving clicks inside lightbox.
  // A preceding recorded action may already have opened this modal. Reopening
  // it races the URL bridge / exit animation and can detach the real CTA while
  // the cursor is travelling. A recorded click always acts on the live modal.
  const modalAlreadyOpen =
    click.modalId === "login" && isLoginModalOpenInDom();
  const isLoginAction = isLoginRecordedAction(click);
  const nextBeatOwnsLogin = isLoginRecordedAction(options?.nextRecordedClick);
  if (click.modalId && !modalAlreadyOpen && options?.applyStudioModal) {
    try {
      options.applyStudioModal(click.modalId);
    } catch {
      /* hang-safe */
    }
    await new Promise((r) => setTimeout(r, playbackMs(350)));
  } else if (click.modalId && !modalAlreadyOpen) {
    // Fallback: journey runtime may not be wired — try window bridge.
    try {
      (
        window as Window & {
          __studioApplyStudioModal?: (id: string | undefined) => void;
        }
      ).__studioApplyStudioModal?.(click.modalId);
    } catch {
      /* hang-safe */
    }
    await new Promise((r) => setTimeout(r, playbackMs(350)));
  }

  const cameraChain =
    click.cameraSelectorChain ??
    (click.cameraAnchorSelector ? [click.cameraAnchorSelector] : undefined);
  if (cameraChain?.length) {
    const cameraEl =
      resolvePlaybackSelectorChain(cameraChain, document) ??
      (click.cameraAnchorSelector
        ? document.querySelector<HTMLElement>(click.cameraAnchorSelector)
        : null);
    if (cameraEl && !isDegradedClickTarget(cameraEl)) {
      await scrollCameraToTarget(cameraEl, { instant: false });
    }
  }

  let target = await waitForStableRecordedClickTarget(click);
  if (!target && isLoginModalOpenInDom()) {
    const drain = await drainLoginModalIfOpen({ fast: isFastPlayback() });
    if (!drain.ok) {
      playbackDiagClick({
        ok: false,
        selector: click.selectorChain?.[0] ?? click.element ?? "?",
        detail: `click FAIL — login drain failed (${drain.reason ?? "unknown"})`,
      });
      return scriptFail(
        drain.reason
          ? `recorded-click:login-drain:${drain.reason}`
          : "recorded-click:login-drain-failed"
      );
    }
    if (drain.drained) {
      target = await waitForStableRecordedClickTarget(click);
    }
  }

  if (!target) {
    const underModal =
      Boolean(resolvePlaybackSelectorChain(click.selectorChain, document)) &&
      isBlockingModalOpen();
    playbackDiagClick({
      ok: false,
      selector: click.selectorChain?.[0] ?? click.element ?? "?",
      detail: underModal
        ? "click FAIL — recorded target under blocking modal (no click-through)"
        : "click FAIL — degraded/missing recorded target (no invent success)",
    });
    return scriptFail(
      underModal
        ? "recorded-click:blocked-by-modal"
        : "recorded-click:target-degraded"
    );
  }

  let clicked = false;
  for (let attempt = 0; attempt < 3 && !clicked; attempt += 1) {
    // The cursor flight itself gives React time to replace a result tile. A
    // failed simulation dispatches no click, so safely re-resolve the semantic
    // target and retry instead of stalling on the detached node.
    const liveTarget =
      attempt === 0 && isClickableTarget(target)
        ? target
        : await waitForStableRecordedClickTarget(click);
    if (!liveTarget) break;
    clicked = await simulateDemoPointerClick(liveTarget, { scroll: true });
  }
  if (!clicked) return fromBool(false, "recorded-click");

  // PDP Book Now (logged out) opens login — sign in so later beats can proceed.
  // Brief wait so React can paint the modal before we look for it.
  await new Promise((r) => setTimeout(r, playbackMs(200)));
  if (
    isLoginModalOpenInDom() &&
    !nextBeatOwnsLogin &&
    !isLoginAction
  ) {
    const drain = await drainLoginModalIfOpen({ fast: isFastPlayback() });
    if (!drain.ok) {
      playbackDiagClick({
        ok: false,
        selector: click.selectorChain?.[0] ?? click.element ?? "?",
        detail: `click ok but login drain failed (${drain.reason ?? "unknown"})`,
      });
      return scriptFail(
        drain.reason
          ? `recorded-click:login-drain:${drain.reason}`
          : "recorded-click:login-drain-failed"
      );
    }
  }

  return { ok: true };
}
