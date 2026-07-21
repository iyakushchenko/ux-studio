import {
  resolveUsableDemoClickTarget,
} from "@/app/recording/recordingCapture";
import type { JourneyBeatRecordedClick } from "@/app/orchestra/types";
import { simulateDemoPointerClick } from "@/app/scenario/demoCursor";
import { scrollCameraToTarget } from "@/app/scenario/playbackScroll";
import { resolveClickTargetRespectingModal } from "@/app/shell/studioModalGuard";
import {
  fromBool,
  type PlaybackScriptResult,
} from "@/projects/playbackScriptResult";
import { resolvePlaybackSelectorChain } from "@/app/recording/recordingCapture";
import { isDegradedClickTarget } from "@/app/recording/recordingLabels";
import { playbackDiagClick } from "@/app/shell/playbackDiag";

export async function playRecordedClick(
  click: JourneyBeatRecordedClick,
  options?: { skip?: boolean }
): Promise<PlaybackScriptResult> {
  if (options?.skip) return { ok: true };

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

  const resolved = resolvePlaybackSelectorChain(click.selectorChain, document);
  const modalResolved = resolveClickTargetRespectingModal(resolved, {
    resolveInModal: (modal) =>
      resolvePlaybackSelectorChain(click.selectorChain, modal),
  });
  const target = resolveUsableDemoClickTarget(modalResolved);
  if (!target) {
    playbackDiagClick({
      ok: false,
      selector: click.selectorChain?.[0] ?? click.element ?? "?",
      detail: "click FAIL — degraded/missing recorded target (no invent success)",
    });
    return { ok: false, step: "recorded-click:target-degraded" };
  }

  const clicked = await simulateDemoPointerClick(target, { scroll: true });
  return fromBool(clicked, "recorded-click");
}
