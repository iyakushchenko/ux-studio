/**
 * Last user/playback interaction before a diagnostic — attached to reports so
 * agents can see whether a failure followed Step forward, a director script, etc.
 */

import {
  notifyRecordingDemoClick,
  notifyRecordingFromInteraction,
} from "@/app/recording/recordingCapture";

export type PlaybackInteractionKind =
  | "transport"
  | "director-manual"
  | "director-auto"
  | "beat-enter"
  | "retreat-sync"
  | "demo-click";

export type PlaybackInteractionRecord = {
  kind: PlaybackInteractionKind;
  /** Human-readable summary, e.g. `Studio nav — Step forward` */
  label: string;
  /** Optional DOM hint for demo clicks */
  element?: string;
  beatId?: string;
  scriptId?: string;
  atMs: number;
};

let lastInteraction: PlaybackInteractionRecord | null = null;

export function resetPlaybackInteractionContext(): void {
  lastInteraction = null;
}

export function getLastPlaybackInteraction(): PlaybackInteractionRecord | null {
  return lastInteraction;
}

function record(
  entry: Omit<PlaybackInteractionRecord, "atMs"> & { atMs?: number }
): void {
  lastInteraction = {
    ...entry,
    atMs: entry.atMs ?? performance.now(),
  };
  notifyRecordingFromInteraction(lastInteraction);
}

export type ManualTransportAction =
  | "step-forward"
  | "step-back"
  | "jump-to-start"
  | "jump-to-end"
  | "play";

const TRANSPORT_LABELS: Record<ManualTransportAction, string> = {
  "step-forward": "Studio nav — Step forward",
  "step-back": "Studio nav — Step back",
  "jump-to-start": "Studio nav — Jump to start",
  "jump-to-end": "Studio nav — Jump to end",
  play: "Studio nav — Play / Pause",
};

export function notePlaybackTransport(action: ManualTransportAction): void {
  record({
    kind: "transport",
    label: TRANSPORT_LABELS[action],
  });
}

export function notePlaybackDirectorScript(options: {
  scriptId: string;
  scriptKind?: string;
  beatId?: string;
  beatLabel?: string;
  manual?: boolean;
}): void {
  const ref = options.scriptKind
    ? `${options.scriptKind}/${options.scriptId}`
    : options.scriptId;
  const beat = options.beatLabel ?? options.beatId;
  record({
    kind: options.manual ? "director-manual" : "director-auto",
    label: options.manual
      ? `Manual director step — ${ref}${beat ? ` (${beat})` : ""}`
      : `Director script — ${ref}${beat ? ` (${beat})` : ""}`,
    beatId: options.beatId,
    scriptId: options.scriptId,
  });
}

export function notePlaybackBeatEnter(actionId: string, beatId?: string): void {
  record({
    kind: "beat-enter",
    label: `Beat enter — ${actionId}`,
    beatId,
    scriptId: actionId,
  });
}

export function notePlaybackRetreatSync(options: {
  beatId: string;
  scriptId?: string;
}): void {
  record({
    kind: "retreat-sync",
    label: `CJM step back — sync ${options.scriptId ?? options.beatId}`,
    beatId: options.beatId,
    scriptId: options.scriptId,
  });
}

/** Describe a demo-click target for diagnostic reports. */
export function describePlaybackElement(el: HTMLElement): string {
  const root =
    el.closest<HTMLElement>("[data-studio-avail-store]") ??
    el.closest<HTMLElement>("[data-name]") ??
    el;

  const parts: string[] = [];
  const tag = root.tagName.toLowerCase();
  parts.push(`<${tag}>`);

  const dataName = root.getAttribute("data-name");
  if (dataName) parts.push(`data-name="${dataName}"`);

  const storeId = root.getAttribute("data-studio-avail-store");
  if (storeId) parts.push(`store="${storeId}"`);

  const aria = root.getAttribute("aria-label")?.trim();
  if (aria) parts.push(`aria-label="${aria.slice(0, 48)}"`);

  const text = (root.textContent ?? "").replace(/\s+/g, " ").trim();
  if (text && text.length <= 72) {
    parts.push(`text="${text}"`);
  } else if (text) {
    parts.push(`text="${text.slice(0, 69)}…"`);
  }

  return parts.join(" ");
}

export function notePlaybackDemoClick(target: HTMLElement): void {
  const element = describePlaybackElement(target);
  record({
    kind: "demo-click",
    label: "Robo-cursor click",
    element,
  });
  notifyRecordingDemoClick(target, element);
}

export function formatPlaybackInteraction(
  interaction: PlaybackInteractionRecord | null | undefined
): string | undefined {
  if (!interaction) return undefined;
  if (interaction.element) {
    return `${interaction.label} → ${interaction.element}`;
  }
  return interaction.label;
}
