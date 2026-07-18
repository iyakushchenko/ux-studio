import type { AvailStep } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import type { JourneyBeat, ProtoJourneyDefinition } from "@/app/orchestra/types";
import type { StudioTouchpointEntry } from "@/projects/types";

export const DEFAULT_CHAT_SCENARIO_FRAMES = 9;

export type { StudioTouchpointEntry };

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

export function resolveStudioTouchpointProgress(
  playlist: StudioTouchpointEntry[],
  touchpointKey: string
): { visibleCount: number; totalFrames: number } {
  const totalFrames = playlist.length;
  if (totalFrames === 0) {
    return { visibleCount: 0, totalFrames: 0 };
  }

  const exactIndex = playlist.findIndex((entry) => entry.key === touchpointKey);
  if (exactIndex >= 0) {
    return { visibleCount: exactIndex + 1, totalFrames };
  }

  const beatPrefix = touchpointKey.match(/^beat:([^:]+)/)?.[1];
  if (beatPrefix) {
    const beatIndex = playlist.findIndex((entry) =>
      entry.key.startsWith(`beat:${beatPrefix}`)
    );
    if (beatIndex >= 0) {
      return { visibleCount: beatIndex + 1, totalFrames };
    }
  }

  return { visibleCount: 1, totalFrames };
}
