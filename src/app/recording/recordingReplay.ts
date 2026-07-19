import type {
  CompiledBeatSegment,
  CompiledRecordingTimeline,
  RecordedEvent,
  RecordingReplayOptions,
  RecordingReplayResult,
  RecordingSession,
} from "@/app/recording/recordingTypes";

const TRANSPORT_KIND = "transport" as const;
const SCREEN_KIND = "screen" as const;
const DEMO_CLICK_KIND = "demo-click" as const;
const WIRE_INTENT_KIND = "wire-intent" as const;
const DIRECTOR_SCRIPT_KIND = "director-script" as const;

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
  session: RecordingSession
): CompiledRecordingTimeline {
  const segments: CompiledBeatSegment[] = [];
  const preamble: RecordedEvent[] = [];

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
 * v3 replays transport + screen + dwell + demo-click + wire-intent +
 * director-script + beat-enter + scroll + typed-text (when wired).
 * studio / touchpoint — counted as unsupported (markers only).
 */
export async function replayRecordingSession(
  session: RecordingSession,
  options: RecordingReplayOptions = {}
): Promise<RecordingReplayResult> {
  const result: RecordingReplayResult = {
    replayed: 0,
    skipped: 0,
    unsupported: 0,
    errors: [],
  };

  const trigger = options.triggerTransport;
  const applyScreen = options.applyScreen;
  const applyDemoClick = options.applyDemoClick;
  const applyWireIntent = options.applyWireIntent;
  const applyDirectorScript = options.applyDirectorScript;
  const applyBeatEnter = options.applyBeatEnter;
  const applyScroll = options.applyScroll;
  const applyTypedText = options.applyTypedText;
  if (
    !trigger &&
    !applyScreen &&
    !applyDemoClick &&
    !applyWireIntent &&
    !applyDirectorScript &&
    !applyBeatEnter &&
    !applyScroll &&
    !applyTypedText
  ) {
    result.errors.push(
      "triggerTransport, applyScreen, applyDemoClick, applyWireIntent, applyDirectorScript, applyBeatEnter, applyScroll, or applyTypedText is required for replay"
    );
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

    if (event.kind === DEMO_CLICK_KIND) {
      if (!applyDemoClick) {
        result.unsupported += 1;
        continue;
      }
      try {
        const applied = await applyDemoClick({
          element: event.element,
          selectorChain: event.selectorChain,
          beatId: event.beatId,
          touchpointKey: event.touchpointKey,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push(
            `demo-click ${event.element}: target not found or click failed`
          );
          continue;
        }
        result.replayed += 1;
        if (stepDelayMs > 0) {
          await delay(stepDelayMs);
        }
      } catch (err) {
        result.errors.push(
          `demo-click ${event.element}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
      continue;
    }

    if (event.kind === WIRE_INTENT_KIND) {
      if (!applyWireIntent) {
        result.unsupported += 1;
        continue;
      }
      try {
        const applied = await applyWireIntent({
          intentId: event.intentId,
          payload: event.payload,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push(
            `wire-intent ${event.intentId}: apply returned false`
          );
          continue;
        }
        result.replayed += 1;
        if (stepDelayMs > 0) {
          await delay(stepDelayMs);
        }
      } catch (err) {
        result.errors.push(
          `wire-intent ${event.intentId}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
      continue;
    }

    if (event.kind === DIRECTOR_SCRIPT_KIND) {
      if (!applyDirectorScript) {
        result.unsupported += 1;
        continue;
      }
      try {
        const applied = await applyDirectorScript({
          scriptId: event.scriptId,
          scriptKind: event.scriptKind,
          beatId: event.beatId,
          manual: event.manual,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push(
            `director-script ${event.scriptId}: apply returned false`
          );
          continue;
        }
        result.replayed += 1;
        if (stepDelayMs > 0) {
          await delay(stepDelayMs);
        }
      } catch (err) {
        result.errors.push(
          `director-script ${event.scriptId}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
      continue;
    }

    if (event.kind === "beat-enter") {
      if (!applyBeatEnter) {
        result.unsupported += 1;
        continue;
      }
      try {
        const applied = await applyBeatEnter({
          actionId: event.actionId,
          beatId: event.beatId,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push(
            `beat-enter ${event.actionId}: apply returned false`
          );
          continue;
        }
        result.replayed += 1;
        if (stepDelayMs > 0) {
          await delay(stepDelayMs);
        }
      } catch (err) {
        result.errors.push(
          `beat-enter ${event.actionId}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
      continue;
    }

    if (event.kind === "scroll") {
      if (!applyScroll) {
        result.unsupported += 1;
        continue;
      }
      try {
        const applied = await applyScroll({
          scrollTop: event.scrollTop,
          anchorSelector: event.anchorSelector,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push("scroll: apply returned false");
          continue;
        }
        result.replayed += 1;
        if (stepDelayMs > 0) {
          await delay(stepDelayMs);
        }
      } catch (err) {
        result.errors.push(
          `scroll: ${err instanceof Error ? err.message : String(err)}`
        );
      }
      continue;
    }

    if (event.kind === "typed-text") {
      if (!applyTypedText) {
        result.unsupported += 1;
        continue;
      }
      try {
        const applied = await applyTypedText({
          value: event.value,
          selectorChain: event.selectorChain,
          element: event.element,
          inputType: event.inputType,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push(
            `typed-text ${event.element ?? "field"}: target not found or apply failed`
          );
          continue;
        }
        result.replayed += 1;
        if (stepDelayMs > 0) {
          await delay(stepDelayMs);
        }
      } catch (err) {
        result.errors.push(
          `typed-text ${event.element ?? "field"}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
      continue;
    }

    result.unsupported += 1;
  }

  return result;
}

/** Summarize what a session would compile to — useful for MCP inspection. */
export function summarizeRecordingSession(session: RecordingSession): {
  eventCount: number;
  byKind: Record<string, number>;
  touchpointCount: number;
  transportCount: number;
  screenCount: number;
  demoClickCount: number;
  wireIntentCount: number;
  directorScriptCount: number;
  beatEnterCount: number;
  scrollCount: number;
  typedTextCount: number;
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
    demoClickCount: byKind["demo-click"] ?? 0,
    wireIntentCount: byKind["wire-intent"] ?? 0,
    directorScriptCount: byKind["director-script"] ?? 0,
    beatEnterCount: byKind["beat-enter"] ?? 0,
    scrollCount: byKind.scroll ?? 0,
    typedTextCount: byKind["typed-text"] ?? 0,
    durationMs,
  };
}
