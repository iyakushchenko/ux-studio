import type {
  CompiledBeatSegment,
  CompiledRecordingTimeline,
  ProtoRecordedEvent,
  ProtoRecordingReplayOptions,
  ProtoRecordingReplayResult,
  ProtoRecordingSession,
} from "@/app/recording/protoRecordingTypes";

const TRANSPORT_KIND = "transport" as const;
const SCREEN_KIND = "screen" as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Propose beat boundaries from touchpoint markers in a recording.
 * Events between touchpoint markers become segment payloads for future
 * journeys.ts compilation.
 */
export function compileRecordingToBeatTimeline(
  session: ProtoRecordingSession
): CompiledRecordingTimeline {
  const segments: CompiledBeatSegment[] = [];
  const preamble: ProtoRecordedEvent[] = [];

  let currentSegment: CompiledBeatSegment | null = null;

  for (const event of session.events) {
    if (event.kind === "touchpoint") {
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = {
        touchpointKey: event.touchpointKey,
        beatId: event.beatId,
        label: event.label,
        counter: event.counter,
        startedAtMs: event.atMs,
        events: [],
      };
      continue;
    }

    if (currentSegment) {
      currentSegment.events.push(event);
    } else {
      preamble.push(event);
    }
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return {
    sessionId: session.id,
    segments,
    preamble,
  };
}

/**
 * v1.1 replays transport + screen (deep-link restore) + dwell.
 * demo-click, wire-intent, scroll, director-script — counted as unsupported.
 */
export async function replayRecordingSession(
  session: ProtoRecordingSession,
  options: ProtoRecordingReplayOptions = {}
): Promise<ProtoRecordingReplayResult> {
  const result: ProtoRecordingReplayResult = {
    replayed: 0,
    skipped: 0,
    unsupported: 0,
    errors: [],
  };

  const trigger = options.triggerTransport;
  const applyScreen = options.applyScreen;
  if (!trigger && !applyScreen) {
    result.errors.push("triggerTransport or applyScreen is required for replay");
    return result;
  }

  const stepDelayMs = options.stepDelayMs ?? 400;
  const shouldAbort = options.shouldAbort ?? (() => false);

  for (const event of session.events) {
    if (shouldAbort()) {
      result.errors.push("replay aborted");
      break;
    }

    if (event.kind === TRANSPORT_KIND) {
      if (!trigger) {
        result.errors.push(`transport ${event.action}: triggerTransport missing`);
        continue;
      }
      try {
        await trigger(event.action);
        result.replayed += 1;
        if (stepDelayMs > 0) {
          await delay(stepDelayMs);
        }
      } catch (err) {
        result.errors.push(
          `transport ${event.action}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
      continue;
    }

    if (event.kind === SCREEN_KIND) {
      if (!applyScreen) {
        result.unsupported += 1;
        continue;
      }
      try {
        const applied = await applyScreen({
          screenId: event.screenId,
          projectId: event.projectId,
          studioUrl: event.studioUrl,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push(`screen ${event.screenId}: apply returned false`);
          continue;
        }
        result.replayed += 1;
        if (stepDelayMs > 0) {
          await delay(stepDelayMs);
        }
      } catch (err) {
        result.errors.push(
          `screen ${event.screenId}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
      continue;
    }

    if (event.kind === "dwell") {
      const dwellMs = event.durationMs ?? stepDelayMs;
      await delay(dwellMs);
      result.replayed += 1;
      continue;
    }

    if (
      event.kind === "demo-click" &&
      options.replayDemoClicks
    ) {
      // v2 — resolve selectorChain and call simulateDemoPointerClick
      result.unsupported += 1;
      continue;
    }

    if (
      event.kind === "wire-intent" &&
      options.replayWireIntents
    ) {
      // v2 — dispatch via project playback.runBeatAction
      result.unsupported += 1;
      continue;
    }

    result.unsupported += 1;
  }

  return result;
}

/** Summarize what a session would compile to — useful for MCP inspection. */
export function summarizeRecordingSession(session: ProtoRecordingSession): {
  eventCount: number;
  byKind: Record<string, number>;
  touchpointCount: number;
  transportCount: number;
  screenCount: number;
  durationMs: number | null;
} {
  const byKind: Record<string, number> = {};
  for (const event of session.events) {
    byKind[event.kind] = (byKind[event.kind] ?? 0) + 1;
  }

  const first = session.events[0]?.atMs;
  const last = session.events[session.events.length - 1]?.atMs;
  const durationMs =
    first != null && last != null && last >= first ? last - first : null;

  return {
    eventCount: session.events.length,
    byKind,
    touchpointCount: byKind.touchpoint ?? 0,
    transportCount: byKind.transport ?? 0,
    screenCount: byKind.screen ?? 0,
    durationMs,
  };
}
