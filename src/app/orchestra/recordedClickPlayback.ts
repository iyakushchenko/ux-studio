/**
 * Compile v2 — play a recorded demo-click beat via engine demo cursor + camera.
 */

import {
  resolvePlaybackSelectorChain,
} from "@/app/recording/recordingCapture";
import type { JourneyBeatRecordedClick } from "@/app/orchestra/types";
import { simulateDemoPointerClick } from "@/app/scenario/demoCursor";
import { scrollCameraToTarget } from "@/app/scenario/playbackScroll";
import { resolveClickTargetRespectingModal } from "@/app/shell/studioModalGuard";
import {
  fromBool,
  type PlaybackScriptResult,
} from "@/projects/playbackScriptResult";

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
    if (cameraEl) {
      await scrollCameraToTarget(cameraEl, { instant: false });
    }
  }

  const resolved = resolvePlaybackSelectorChain(click.selectorChain, document);
  const target = resolveClickTargetRespectingModal(resolved, {
    resolveInModal: (modal) =>
      resolvePlaybackSelectorChain(click.selectorChain, modal),
  });
  if (!target) {
    return { ok: false, step: "recorded-click:target-missing" };
  }

  const clicked = await simulateDemoPointerClick(target, { scroll: true });
  return fromBool(clicked, "recorded-click");
}
