import type { AvailStep } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import type { JourneyBeat, JourneyDefinition } from "@/app/orchestra/types";
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
  /** Book Step 3 confirmation screen (child 3) — label before beat index catches up. */
  bookConfirmationScreen?: boolean;
};

export const BOOK_CONFIRMATION_TOUCHPOINT_LABEL = "Book — confirmed";

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

/** Playlist key for an avail overlay beat (may be popup:* not beat:*). */
export function overlayBeatKey(beat: JourneyBeat): string {
  if (beat.id === "avail-book") return `beat:${beat.id}`;
  if (beat.availScript === "continue-from-date") {
    return "popup:availability:date";
  }
  if (beat.availScript === "select-time-slot") {
    return "popup:availability:time";
  }
  return `beat:${beat.id}`;
}

/** Anchor key used for STEPS counter — must match expandBeatToTouchpoints. */
export function beatPlaylistAnchorKey(beat: JourneyBeat): string {
  if (beat.kind === "overlay" && beat.availScript) {
    return overlayBeatKey(beat);
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
    // One playlist frame per content bubble. Thinking is visual-only during
    // beforeReveal — a separate :thinking slot made one SF jump STEPS +2
    // (playlist-frame-skip Alarm: #2→#4 on r0).
    for (let frame = 1; frame <= total; frame++) {
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
  journey: JourneyDefinition | undefined,
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

  // book-step3-camera dwells on the same tab (child 3) as confirmation — must
  // keep its own key or CJM step-back self-loops (retreat target === current
  // beat) since resolveJourneyRetreatTarget scans by touchpoint key, not tab.
  if (input.bookConfirmationScreen && input.beatId !== "book-step3-camera") {
    return {
      label: BOOK_CONFIRMATION_TOUCHPOINT_LABEL,
      key: "beat:confirmation",
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

    // During agent thinking, pin STEPS on the upcoming reply frame (same
    // playlist slot) — label shows thinking; counter advances once per SF.
    if (
      input.chatPausingBeforeReveal &&
      (input.chatPlaybackThinking ||
        isSitePilotChatAgentReplyFrameIndex(frame + 1))
    ) {
      const nextFrame = frame + 1;
      return {
        key: `beat:agentic-chat:frame:${nextFrame}`,
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

  // Prefer exact `frame:N` over legacy `frame:N:thinking` prefix matches.
  const chatFrameMatch = touchpointKey.match(
    /^beat:([^:]+):frame:(\d+)(?::thinking)?$/
  );
  if (chatFrameMatch) {
    const [, beatId, frame] = chatFrameMatch;
    const exactFrameKey = `beat:${beatId}:frame:${frame}`;
    const exactFrameIndex = playlist.findIndex(
      (entry) => entry.key === exactFrameKey
    );
    if (exactFrameIndex >= 0) return exactFrameIndex;
    const legacyThinkingIndex = playlist.findIndex(
      (entry) => entry.key === `${exactFrameKey}:thinking`
    );
    if (legacyThinkingIndex >= 0) return legacyThinkingIndex;
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
  // avail-continue owns popup:availability:date; date/time substeps may lead the beat.
  if (
    (beatId === "avail-continue" || beatId === "avail-time") &&
    touchpointKey.startsWith("popup:availability:")
  ) {
    return true;
  }
  // Chat finale dateChat handoff — brief race if beat flush lags Availability open.
  if (
    beatId === "agentic-chat" &&
    touchpointKey.startsWith("popup:availability:")
  ) {
    return true;
  }
  // PDP Book now opens login before beat index catches up (may still be on plp/pdp).
  if (
    touchpointKey === "popup:login" &&
    (beatId === "traditional-plp" || beatId === "traditional-pdp")
  ) {
    return true;
  }
  return false;
}

/** Screen-frames scenario substeps (e.g. chat frame 2/9) while beat index stays put. */
export function isScenarioFrameSubstepOfBeat(
  beatId: string | undefined,
  touchpointKey: string
): boolean {
  if (!beatId) return false;
  return touchpointKey.startsWith(`beat:${beatId}:frame:`);
}

/** Touchpoint may run ahead of the beat anchor without violating transport contract. */
export function isAllowedTouchpointAheadOfBeat(
  beatId: string | undefined,
  touchpointKey: string
): boolean {
  return (
    isPopupSubstepOfBeat(beatId, touchpointKey) ||
    isScenarioFrameSubstepOfBeat(beatId, touchpointKey)
  );
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
    beatPlaylistAnchorKey(beat)
  );
  if (isPopupSubstepOfBeat(beat.id, touchpointKey)) {
    return {
      // Prefer beat anchor; if playlist uses popup:* for the beat itself,
      // fall back to the live touchpoint so STEPS never flashes 0/N.
      visibleCount:
        beatProgress.visibleCount > 0
          ? beatProgress.visibleCount
          : touchpointProgress.visibleCount,
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
