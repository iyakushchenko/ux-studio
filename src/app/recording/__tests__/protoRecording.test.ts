import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendRecordingEvent,
  deserializeRecordingSession,
  getActiveRecordingSession,
  getLastRecordingSession,
  isRecordingActive,
  pauseRecording,
  resetRecordingSessionForTests,
  resumeRecording,
  serializeRecordingSession,
  stageRecordingSession,
  startRecording,
  stopRecording,
  subscribeRecordingSession,
} from "@/app/recording/protoRecordingSession";
import type { ProtoRecordingSession } from "@/app/recording/protoRecordingTypes";
import {
  compileRecordingToBeatTimeline,
  replayRecordingSession,
} from "@/app/recording/protoRecordingReplay";
import {
  notifyRecordingFromInteraction,
  resetRecordingCaptureForTests,
} from "@/app/recording/protoRecordingCapture";
import { notePlaybackTransport } from "@/app/shell/protoPlaybackInteractionContext";

function sampleSession(): ProtoRecordingSession {
  return {
    id: "test-session",
    version: 1,
    startedAt: "2026-07-19T00:00:00.000Z",
    projectId: "boots-pharmacy",
    personaId: "sarah-jenkins",
    journeyId: "agentic-cjm",
    events: [
      {
        kind: "transport",
        action: "jump-to-start",
        atMs: 100,
      },
      {
        kind: "touchpoint",
        touchpointKey: "beat:agentic-home",
        beatId: "agentic-home",
        label: "Home",
        counter: "1 / 25",
        atMs: 200,
      },
      {
        kind: "transport",
        action: "step-forward",
        atMs: 300,
      },
      {
        kind: "touchpoint",
        touchpointKey: "beat:agentic-chat:frame:2",
        beatId: "agentic-chat",
        label: "Chat",
        counter: "3 / 25",
        atMs: 500,
      },
      {
        kind: "demo-click",
        element: '<button> data-name="Send"',
        selectorChain: ['[data-name="Send"]'],
        atMs: 600,
      },
    ],
  };
}

describe("protoRecordingSession", () => {
  beforeEach(() => {
    resetRecordingSessionForTests();
    resetRecordingCaptureForTests();
  });

  afterEach(() => {
    resetRecordingSessionForTests();
    resetRecordingCaptureForTests();
  });

  it("starts, pauses, resumes, and stops a session", () => {
    expect(isRecordingActive()).toBe(false);

    const session = startRecording({ projectId: "boots-pharmacy" });
    expect(session.projectId).toBe("boots-pharmacy");
    expect(isRecordingActive()).toBe(true);

    expect(pauseRecording()).toBe(true);
    expect(isRecordingActive()).toBe(false);
    appendRecordingEvent({ kind: "transport", action: "play", atMs: 1 });
    expect(getActiveRecordingSession()?.events).toHaveLength(0);

    expect(resumeRecording()).toBe(true);
    appendRecordingEvent({ kind: "transport", action: "play", atMs: 2 });
    expect(getActiveRecordingSession()?.events).toHaveLength(1);

    const finished = stopRecording();
    expect(finished?.stoppedAt).toBeDefined();
    expect(getActiveRecordingSession()).toBeNull();
    expect(getLastRecordingSession()?.id).toBe(finished?.id);
  });

  it("stages imported sessions and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeRecordingSession(listener);
    const imported = sampleSession();

    stageRecordingSession(imported);

    expect(getLastRecordingSession()).toEqual(imported);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("dedupes rapid duplicate transport events", () => {
    startRecording();
    appendRecordingEvent({ kind: "transport", action: "step-forward", atMs: 100 });
    appendRecordingEvent({ kind: "transport", action: "step-forward", atMs: 120 });
    appendRecordingEvent({ kind: "transport", action: "step-forward", atMs: 250 });

    expect(getActiveRecordingSession()?.events).toHaveLength(2);
  });

  it("serializes and deserializes sessions", () => {
    const session = sampleSession();
    const json = serializeRecordingSession(session);
    const restored = deserializeRecordingSession(json);

    expect(restored).toEqual(session);
  });

  it("rejects unsupported recording versions", () => {
    expect(() =>
      deserializeRecordingSession(JSON.stringify({ version: 99, id: "x", events: [] }))
    ).toThrow(/Unsupported recording version/);
  });
});

describe("protoRecordingCapture bridge", () => {
  beforeEach(() => {
    resetRecordingSessionForTests();
    resetRecordingCaptureForTests();
    startRecording();
  });

  afterEach(() => {
    resetRecordingSessionForTests();
    resetRecordingCaptureForTests();
  });

  it("captures transport from playback interaction context", () => {
    notePlaybackTransport("step-forward");

    const events = getActiveRecordingSession()?.events ?? [];
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: "transport",
      action: "step-forward",
    });
  });

  it("maps director scripts from interaction records", () => {
    notifyRecordingFromInteraction({
      kind: "director-auto",
      label: "Director script — home/sarah-query-submit",
      scriptId: "sarah-query-submit",
      beatId: "agentic-home",
      atMs: 42,
    });

    expect(getActiveRecordingSession()?.events[0]).toMatchObject({
      kind: "director-script",
      scriptId: "sarah-query-submit",
      beatId: "agentic-home",
      manual: false,
    });
  });
});

describe("compileRecordingToBeatTimeline", () => {
  it("segments events by touchpoint markers", () => {
    const compiled = compileRecordingToBeatTimeline(sampleSession());

    expect(compiled.preamble).toHaveLength(1);
    expect(compiled.preamble[0].kind).toBe("transport");
    expect(compiled.segments).toHaveLength(2);
    expect(compiled.segments[0]).toMatchObject({
      touchpointKey: "beat:agentic-home",
      beatId: "agentic-home",
    });
    expect(compiled.segments[0].events).toHaveLength(1);
    expect(compiled.segments[0].events[0].kind).toBe("transport");
    expect(compiled.segments[1].events[0].kind).toBe("demo-click");
  });
});

describe("replayRecordingSession", () => {
  it("replays transport and dwell events in v1", async () => {
    vi.useFakeTimers();
    const transport = vi.fn();

    const session: ProtoRecordingSession = {
      id: "replay-test",
      version: 1,
      startedAt: "2026-07-19T00:00:00.000Z",
      events: [
        { kind: "transport", action: "step-forward", atMs: 1 },
        { kind: "dwell", durationMs: 100, atMs: 2 },
        { kind: "demo-click", element: "btn", atMs: 3 },
      ],
    };

    const promise = replayRecordingSession(session, {
      triggerTransport: transport,
      stepDelayMs: 50,
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(transport).toHaveBeenCalledWith("step-forward");
    expect(result.replayed).toBe(2);
    expect(result.unsupported).toBe(1);

    vi.useRealTimers();
  });

  it("replays screen events via applyScreen in order", async () => {
    vi.useFakeTimers();
    const applyScreen = vi.fn(() => true);
    const transport = vi.fn();

    const session: ProtoRecordingSession = {
      id: "screen-replay-test",
      version: 1,
      startedAt: "2026-07-19T00:00:00.000Z",
      projectId: "boots-pharmacy",
      events: [
        {
          kind: "screen",
          screenId: "book-step-1",
          projectId: "boots-pharmacy",
          studioUrl: "?project=boots-pharmacy&screen=book-step-1",
          atMs: 10,
        },
        {
          kind: "screen",
          screenId: "book-step-2",
          projectId: "boots-pharmacy",
          studioUrl: "?project=boots-pharmacy&screen=book-step-2",
          atMs: 20,
        },
        {
          kind: "screen",
          screenId: "book-step-3",
          projectId: "boots-pharmacy",
          studioUrl: "?project=boots-pharmacy&screen=book-step-3",
          atMs: 30,
        },
        { kind: "demo-click", element: "btn", atMs: 40 },
      ],
    };

    const promise = replayRecordingSession(session, {
      triggerTransport: transport,
      applyScreen,
      stepDelayMs: 0,
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(applyScreen).toHaveBeenCalledTimes(3);
    expect(applyScreen.mock.calls.map((c) => c[0].screenId)).toEqual([
      "book-step-1",
      "book-step-2",
      "book-step-3",
    ]);
    expect(transport).not.toHaveBeenCalled();
    expect(result.replayed).toBe(3);
    expect(result.unsupported).toBe(1);
    expect(result.errors).toHaveLength(0);

    vi.useRealTimers();
  });

  it("counts screen as unsupported when applyScreen is missing", async () => {
    const result = await replayRecordingSession(
      {
        id: "no-apply",
        version: 1,
        startedAt: "2026-07-19T00:00:00.000Z",
        events: [
          { kind: "screen", screenId: "book-step-1", atMs: 1 },
          { kind: "transport", action: "step-forward", atMs: 2 },
        ],
      },
      {
        triggerTransport: vi.fn(),
        stepDelayMs: 0,
      }
    );

    expect(result.replayed).toBe(1);
    expect(result.unsupported).toBe(1);
  });
});
