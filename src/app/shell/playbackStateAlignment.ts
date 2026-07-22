import type { JourneyBeat } from "@/app/orchestra/types";
import {
  beatPlaylistAnchorKey,
  isAllowedTouchpointAheadOfBeat,
  resolvePlaylistTouchpointIndex,
  resolveStudioTouchpointProgressForBeat,
  type StudioTouchpointEntry,
} from "@/app/nav/resolveStudioTouchpoint";

export type PlaybackStateAlignmentKind =
  | "beat-tab-mismatch"
  | "screen-url-mismatch"
  | "touchpoint-beat-mismatch"
  | "counter-touchpoint-mismatch";

export type PlaybackStateAlignmentAnomaly = {
  kind: PlaybackStateAlignmentKind;
  message: string;
  detail: string;
};

export type PlaybackStateAlignmentInput = {
  beat?: JourneyBeat;
  playlist: readonly StudioTouchpointEntry[];
  touchpointKey: string;
  currentTabIndex: number;
  /** Project adapter result for `beat.protoTab`; omitted when the beat has no tab. */
  expectedTabIndex?: number;
  renderedScreenId?: string;
  /** Real address-bar `screen` value, not a URL synthesized from nav state. */
  addressScreenId?: string;
  visibleCount: number;
  totalFrames: number;
};

export type QueuedAlignmentFrameState = {
  beatId?: string;
  touchpointKey?: string;
  isOnAir?: boolean;
  isScripting?: boolean;
  retreatSyncing?: boolean;
  isPausingBeforeReveal?: boolean;
};

/** Reject a queued sample that became transitional or stale before rAF fired. */
export function shouldDiscardQueuedAlignmentFrame(
  captured: QueuedAlignmentFrameState,
  latest: QueuedAlignmentFrameState
): boolean {
  return Boolean(
    latest.isOnAir ||
      latest.isScripting ||
      latest.retreatSyncing ||
      latest.isPausingBeforeReveal ||
      latest.beatId !== captured.beatId ||
      latest.touchpointKey !== captured.touchpointKey
  );
}

/**
 * Project-neutral settled-state contract for journey playback.
 *
 * Transitional suppression (director script, retreat sync, URL reflect tick) belongs
 * to the caller. This function only compares a snapshot that is expected to be stable.
 */
export function detectPlaybackStateAlignment(
  input: PlaybackStateAlignmentInput
): PlaybackStateAlignmentAnomaly[] {
  const anomalies: PlaybackStateAlignmentAnomaly[] = [];
  const beat = input.beat;

  if (
    beat?.protoTab != null &&
    input.expectedTabIndex != null &&
    input.currentTabIndex !== input.expectedTabIndex
  ) {
    anomalies.push({
      kind: "beat-tab-mismatch",
      message: "Active journey beat does not match the rendered studio tab",
      detail: `beat=${beat.id} protoTab=${beat.protoTab} expectedTabIndex=${input.expectedTabIndex} currentTabIndex=${input.currentTabIndex}`,
    });
  }

  if (
    input.renderedScreenId &&
    input.addressScreenId &&
    input.renderedScreenId !== input.addressScreenId
  ) {
    anomalies.push({
      kind: "screen-url-mismatch",
      message: "Rendered studio screen does not match the address bar",
      detail: `rendered=${input.renderedScreenId} address=${input.addressScreenId}`,
    });
  }

  if (beat) {
    const playlist = [...input.playlist];
    const touchpointIndex = resolvePlaylistTouchpointIndex(
      playlist,
      input.touchpointKey
    );
    const beatAnchor = beatPlaylistAnchorKey(beat);
    const beatIndex = resolvePlaylistTouchpointIndex(playlist, beatAnchor);
    const semanticallyAllowed = isAllowedTouchpointAheadOfBeat(
      beat.id,
      input.touchpointKey
    );

    if (
      touchpointIndex < 0 ||
      beatIndex < 0 ||
      (touchpointIndex !== beatIndex && !semanticallyAllowed)
    ) {
      anomalies.push({
        kind: "touchpoint-beat-mismatch",
        message: "Runtime touchpoint does not belong to the active journey beat",
        detail: `beat=${beat.id} beatAnchor=${beatAnchor} beatIndex=${beatIndex} touchpoint=${input.touchpointKey} touchpointIndex=${touchpointIndex}`,
      });
    }

    const expectedProgress = resolveStudioTouchpointProgressForBeat(
      playlist,
      input.touchpointKey,
      beat
    );
    if (
      input.visibleCount !== expectedProgress.visibleCount ||
      input.totalFrames !== expectedProgress.totalFrames
    ) {
      anomalies.push({
        kind: "counter-touchpoint-mismatch",
        message: "Studio step counter does not match the active touchpoint",
        detail: `actual=${input.visibleCount}/${input.totalFrames} expected=${expectedProgress.visibleCount}/${expectedProgress.totalFrames} touchpoint=${input.touchpointKey}`,
      });
    }
  }

  return anomalies;
}
