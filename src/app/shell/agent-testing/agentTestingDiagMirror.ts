/**
 * PLAYBACK_DIAG → human labels (shared with QA chat bridge).
 * Side pane is deprecated/hidden — chat is the unified chronological sequence.
 */

import type { PlaybackDiagEvent } from "@/app/shell/playbackDiag";
import { getPlaybackDiagBundle } from "@/app/shell/playbackDiag";
import {
  labelForPlaybackDiagEvent,
  shouldMirrorPlaybackDiagToQa,
  outcomeForPlaybackDiagEvent,
} from "@/app/shell/playbackDiagQaBridge";

export type DiagMirrorSeverity = "ok" | "warn" | "fail";

export type DiagMirrorRow = {
  kind: string;
  label: string;
  severity: DiagMirrorSeverity;
  t: number;
};

const DEFAULT_LIMIT = 6;

export function severityForDiagEvent(ev: PlaybackDiagEvent): DiagMirrorSeverity {
  const outcome = outcomeForPlaybackDiagEvent(ev);
  if (outcome === "fail") return "fail";
  if (outcome === "notice") return "warn";
  if (ev.kind === "hub-nav" || ev.kind === "skip") return "warn";
  return "ok";
}

/** Human-friendly label — same copy as QA chat rows. */
export function formatDiagMirrorLabel(ev: PlaybackDiagEvent): string {
  return labelForPlaybackDiagEvent(ev);
}

/** Noise kinds — align with QA bridge suppress list. */
function isDiagMirrorNoise(ev: PlaybackDiagEvent): boolean {
  return !shouldMirrorPlaybackDiagToQa(ev);
}

/** Last-N compact rows (newest last). Prefer reading main QA chat instead. */
export function getDiagMirrorRows(limit = DEFAULT_LIMIT): DiagMirrorRow[] {
  let events: PlaybackDiagEvent[] = [];
  try {
    events = getPlaybackDiagBundle().events ?? [];
  } catch {
    return [];
  }
  const useful = events.filter((ev) => !isDiagMirrorNoise(ev));
  const slice = useful.slice(-Math.max(1, limit));
  return slice.map((ev) => ({
    kind: ev.kind,
    label: formatDiagMirrorLabel(ev),
    severity: severityForDiagEvent(ev),
    t: ev.t,
  }));
}

/** Render into an existing `<ol class="…__diag-mirror">` host (legacy; pane stays hidden). */
export function renderDiagMirrorDom(
  host: HTMLElement | null,
  rows: DiagMirrorRow[] = getDiagMirrorRows()
): void {
  if (!host) return;
  host.replaceChildren();
  if (rows.length === 0) {
    host.dataset.empty = "true";
    const empty = document.createElement("li");
    empty.className = "studio-agent-testing-overlay__diag-mirror-empty";
    empty.textContent = "See QA chat for playback events";
    host.appendChild(empty);
    return;
  }
  delete host.dataset.empty;
  for (const row of rows) {
    const li = document.createElement("li");
    li.dataset.severity = row.severity;
    li.dataset.kind = row.kind;
    li.textContent = row.label;
    host.appendChild(li);
  }
}
