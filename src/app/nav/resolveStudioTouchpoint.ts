import type { AvailStep } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import type { JourneyBeat, ProtoJourneyDefinition } from "@/app/orchestra/types";
import type { StudioTouchpointEntry } from "@/projects/types";

/** Site-pilot-chat playlist size: 8 DOM content frames + 1 virtual finale beat. */
export const DEFAULT_CHAT_SCENARIO_FRAMES = 9;

/** Stable chat frame count for studio playlists — never tied to live scenario playback. */
export function resolveStableChatScenarioPlaylistFrames(
  scenarioId?: string
): number {
  if (scenarioId === "site-pilot-chat" || scenarioId == null) {
    return DEFAULT_CHAT_SCENARIO_FRAMES;
  }
  return DEFAULT_CHAT_SCENARIO_FRAMES;
}

export type { StudioTouchpointEntry };

/** Studio touchpoints for modals/overlays — viewport scroll guard ignores these. */
export const POPUP_TOUCHPOINT_PREFIX = "popup:" as const;

export function isPopupTouchpoint(touchpointKey?: string): boolean {
  return touchpointKey?.startsWith(POPUP_TOUCHPOINT_PREFIX) ?? false;
}

export type StudioTouchpointInput = {
  beatId?: string;
  beatLabel?: string;
  availabilityOpen: boolean;
  availStep?: AvailStep | null;
  vaccinePickerOpen: boolean;
  recipientPickerOpen: boolean;
  loginPopupOpen: boolean;
  quickViewOpen: boolean;
  chatFrameIndex?: number;
  chatFrameTotal?: number;
  chatPausingBeforeReveal?: boolean;
  chatPlaybackThinking?: boolean;
};

/** Agent reply frames in the stepped chat thread (2, 4, 6, 8, …). */
export function isSitePilotChatAgentReplyFrameIndex(frameIndex: number): boolean {
  return frameIndex > 0 && frameIndex % 2 === 0;
}

const AVAIL_STEP_LABELS: Record<AvailStep, string> = {
  start: "Find pharmacy",
  list: "Choose pharmacy",
  map: "Map",
  noSlots: "No slots",
  date: "Choose date",
  time: "Choose time",
};

/** Optional popup touchpoints inserted after specific beats per journey. */
const DEFAULT_POPUP_TOUCHPOINTS: Record<
  string,
  Record<string, StudioTouchpointEntry[]>
> = {};

function overlayBeatKey(beat: JourneyBeat): string {
  if (beat.id === "avail-book") return `beat:${beat.id}`;
  if (beat.availScript === "continue-from-date") {
    return "popup:availability:date";
  }
  if (beat.availScript === "select-time-slot") {
    return "popup:availability:time";
  }
  return `beat:${beat.id}`;
}

function expandBeatToTouchpoints(
  beat: JourneyBeat,
  chatFrames: number
): StudioTouchpointEntry[] {
  if (beat.kind === "screen-frames" && beat.scenarioId === "site-pilot-chat") {
    const total = Math.max(1, chatFrames);
    const items: StudioTouchpointEntry[] = [];
    for (let frame = 1; frame <= total; frame++) {
      if (isSitePilotChatAgentReplyFrameIndex(frame)) {
        items.push({
          key: `beat:${beat.id}:frame:${frame}:thinking`,
          label: `${beat.label} — thinking`,
        });
      }
      items.push({
        key: `beat:${beat.id}:frame:${frame}`,
        label: frame === 1 ? beat.label : `${beat.label} — ${frame}/${total}`,
      });
    }
    return items;
  }

  if (beat.kind === "overlay" && beat.availScript) {
    return [{ key: overlayBeatKey(beat), label: beat.label }];
  }

  return [{ key: `beat:${beat.id}`, label: beat.label }];
}

export function buildStudioTouchpointPlaylist(
  journey: ProtoJourneyDefinition | undefined,
  chatScenarioTotalFrames = DEFAULT_CHAT_SCENARIO_FRAMES,
  options?: {
    shouldSkipBeat?: (beat: JourneyBeat) => boolean;
    popupTouchpoints?: Record<string, Record<string, StudioTouchpointEntry[]>>;
  }
): StudioTouchpointEntry[] {
  if (!journey) return [];

  const items: StudioTouchpointEntry[] = [];
  const popupInserts =
    options?.popupTouchpoints?.[journey.id] ??
    DEFAULT_POPUP_TOUCHPOINTS[journey.id] ??
    {};
  const shouldSkipBeat = options?.shouldSkipBeat ?? (() => false);

  for (const beat of journey.beats) {
    if (shouldSkipBeat(beat)) continue;
    items.push(...expandBeatToTouchpoints(beat, chatScenarioTotalFrames));
    const extras = popupInserts[beat.id];
    if (extras) items.push(...extras);
  }

  return items;
}
export function resolveStudioTouchpoint(
  input: StudioTouchpointInput
): { label: string; key: string } {
  if (input.loginPopupOpen) {
    return { label: "Log in or register", key: "popup:login" };
  }
  if (input.quickViewOpen) {
    return { label: "Quick view", key: "popup:quick-view" };
  }
  if (input.recipientPickerOpen) {
    return { label: "Choose recipient", key: "popup:recipient" };
  }
  if (input.vaccinePickerOpen) {
    return { label: "Choose vaccine", key: "popup:vaccine" };
  }
  if (input.availabilityOpen && input.availStep) {
    if (input.beatId === "avail-book") {
      return {
        label: input.beatLabel ?? "Book",
        key: "beat:avail-book",
      };
    }
    return {
      label: AVAIL_STEP_LABELS[input.availStep],
      key: `popup:availability:${input.availStep}`,
    };
  }

  if (
    input.chatFrameIndex != null &&
    input.chatFrameIndex > 0 &&
    input.beatId === "agentic-chat"
  ) {
    const total = input.chatFrameTotal ?? DEFAULT_CHAT_SCENARIO_FRAMES;
    const frame = input.chatFrameIndex;
    const baseLabel = input.beatLabel ?? "Chat experience";

    if (
      input.chatPausingBeforeReveal &&
      (input.chatPlaybackThinking ||
        isSitePilotChatAgentReplyFrameIndex(frame + 1))
    ) {
      const nextFrame = frame + 1;
      return {
        key: `beat:agentic-chat:frame:${nextFrame}:thinking`,
        label: `${baseLabel} — thinking`,
      };
    }

    return {
      key: `beat:agentic-chat:frame:${frame}`,
      label: frame === 1 ? baseLabel : `${baseLabel} — ${frame}/${total}`,
    };
  }

  const label = input.beatLabel ?? "";
  const key = input.beatId ? `beat:${input.beatId}` : label;
  return { label, key };
}

/** Runtime popup keys that map to a different playlist entry (exact match tried first). */
const TOUCHPOINT_PLAYLIST_ALIASES: Record<string, string[]> = {
  "popup:login": ["beat:traditional-login"],
  "popup:availability:start": ["beat:avail-location", "beat:choose-location"],
  "popup:availability:list": ["beat:avail-location"],
  "popup:availability:map": ["beat:avail-location"],
  "popup:availability:noSlots": ["beat:avail-location"],
};

export function resolvePlaylistTouchpointIndex(
  playlist: StudioTouchpointEntry[],
  touchpointKey: string
): number {
  const exactIndex = playlist.findIndex((entry) => entry.key === touchpointKey);
  if (exactIndex >= 0) return exactIndex;

  const aliasTargets = TOUCHPOINT_PLAYLIST_ALIASES[touchpointKey];
  if (aliasTargets) {
    for (const target of aliasTargets) {
      const aliasIndex = playlist.findIndex((entry) => entry.key === target);
      if (aliasIndex >= 0) return aliasIndex;
    }
  }

  const chatFrameMatch = touchpointKey.match(/^beat:([^:]+):frame:(\d+)/);
  if (chatFrameMatch) {
    const [, beatId, frame] = chatFrameMatch;
    const framePrefix = `beat:${beatId}:frame:${frame}`;
    const frameIndex = playlist.findIndex((entry) =>
      entry.key.startsWith(framePrefix)
    );
    if (frameIndex >= 0) return frameIndex;
  }

  const beatPrefix = touchpointKey.match(/^beat:([^:]+)/)?.[1];
  if (beatPrefix) {
    const beatIndex = playlist.findIndex((entry) =>
      entry.key.startsWith(`beat:${beatPrefix}`)
    );
    if (beatIndex >= 0) return beatIndex;
  }

  return -1;
}

export function resolveStudioTouchpointProgress(
  playlist: StudioTouchpointEntry[],
  touchpointKey: string
): { visibleCount: number; totalFrames: number } {
  const totalFrames = playlist.length;
  if (totalFrames === 0) {
    return { visibleCount: 0, totalFrames: 0 };
  }

  const index = resolvePlaylistTouchpointIndex(playlist, touchpointKey);
  if (index >= 0) {
    return { visibleCount: index + 1, totalFrames };
  }

  return { visibleCount: 0, totalFrames };
}

/** Availability overlay sub-steps while the journey beat has not advanced yet. */
export function isPopupSubstepOfBeat(
  beatId: string | undefined,
  touchpointKey: string
): boolean {
  if (!beatId || !touchpointKey.startsWith(POPUP_TOUCHPOINT_PREFIX)) {
    return false;
  }
  if (
    beatId === "choose-location" &&
    touchpointKey.startsWith("popup:availability:")
  ) {
    return true;
  }
  if (
    beatId === "avail-location" &&
    touchpointKey.startsWith("popup:availability:")
  ) {
    return true;
  }
  return false;
}

/**
 * Step counter for the studio deck — anchors on the active beat so popup
 * sub-steps (e.g. choose-location → availability list) do not skip a frame.
 */
export function resolveStudioTouchpointProgressForBeat(
  playlist: StudioTouchpointEntry[],
  touchpointKey: string,
  beat: JourneyBeat | undefined
): { visibleCount: number; totalFrames: number } {
  const touchpointProgress = resolveStudioTouchpointProgress(
    playlist,
    touchpointKey
  );
  if (!beat || beat.kind === "screen-frames") {
    return touchpointProgress;
  }

  const beatProgress = resolveStudioTouchpointProgress(
    playlist,
    `beat:${beat.id}`
  );
  if (isPopupSubstepOfBeat(beat.id, touchpointKey)) {
    return {
      visibleCount: beatProgress.visibleCount,
      totalFrames: touchpointProgress.totalFrames,
    };
  }

  return {
    visibleCount: Math.max(
      beatProgress.visibleCount,
      touchpointProgress.visibleCount
    ),
    totalFrames: touchpointProgress.totalFrames,
  };
}
