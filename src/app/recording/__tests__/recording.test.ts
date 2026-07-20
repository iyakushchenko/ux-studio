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
} from "@/app/recording/recordingSession";
import type { RecordingSession } from "@/app/recording/recordingTypes";
import {
  compileRecordingToBeatTimeline,
  RECORDING_REPLAY_MIN_STEP_HOLD_MS,
  replayRecordingSession,
  resolveRecordingReplayHoldMs,
} from "@/app/recording/recordingReplay";
import {
  buildPlaybackSelectorChain,
  isRecordingChromeTarget,
  notifyRecordingFromInteraction,
  resetRecordingCaptureForTests,
  resolvePlaybackSelectorChain,
  resolveRecordingHumanClickTarget,
  shouldCaptureRecordingHumanClick,
  shouldCaptureRecordingTypedText,
  captureScroll,
  captureTypedText,
  ensureRecordingDomCapture,
  registerRecordingSnapshotProvider,
  seedRecordingStartScreen,
} from "@/app/recording/recordingCapture";
import { applyRecordingProjectScript } from "@/app/recording/recordingScriptApply";
import { notePlaybackTransport } from "@/app/shell/playbackInteractionContext";
import { resolvePlaybackScriptKind } from "@/app/shell/playbackScriptRegistry";

type FakeEl = {
  attrs: Record<string, string>;
  children: FakeEl[];
  matches: (sel: string) => boolean;
  querySelector: (sel: string) => FakeEl | null;
  querySelectorAll: (sel: string) => FakeEl[];
};

function fakeEl(attrs: Record<string, string>, children: FakeEl[] = []): FakeEl {
  const node: FakeEl = {
    attrs,
    children,
    matches(sel: string) {
      const m = /^\[([^=]+)="([^"]+)"\]$/.exec(sel);
      if (!m) return false;
      return node.attrs[m[1]!] === m[2];
    },
    querySelector(sel: string) {
      if (node.matches(sel)) return node;
      for (const child of node.children) {
        const found = child.querySelector(sel);
        if (found) return found;
      }
      return null;
    },
    querySelectorAll(sel: string) {
      const out: FakeEl[] = [];
      if (node.matches(sel)) out.push(node);
      for (const child of node.children) {
        out.push(...child.querySelectorAll(sel));
      }
      return out;
    },
  };
  return node;
}

function sampleSession(): RecordingSession {
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

describe("recordingSession", () => {
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

  it("notifies subscribers when events append (STEPS counter)", () => {
    startRecording();
    const listener = vi.fn();
    const unsubscribe = subscribeRecordingSession(listener);
    listener.mockClear();

    appendRecordingEvent({ kind: "transport", action: "step-forward", atMs: 10 });

    expect(listener).toHaveBeenCalled();
    expect(getActiveRecordingSession()?.events).toHaveLength(1);
    unsubscribe();
  });

  it("seeds current screen as step 1 once per session", () => {
    registerRecordingSnapshotProvider(() => ({
      screenId: "pdp",
      projectId: "boots-pharmacy",
      studioUrl: "?project=boots-pharmacy&screen=pdp",
    }));
    startRecording({ projectId: "boots-pharmacy" });
    seedRecordingStartScreen();
    seedRecordingStartScreen();

    const events = getActiveRecordingSession()?.events ?? [];
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: "screen",
      screenId: "pdp",
      projectId: "boots-pharmacy",
    });
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

describe("recordingCapture bridge", () => {
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
      scriptKind: "home",
      beatId: "agentic-home",
      atMs: 42,
    });

    expect(getActiveRecordingSession()?.events[0]).toMatchObject({
      kind: "director-script",
      scriptId: "sarah-query-submit",
      scriptKind: "home",
      beatId: "agentic-home",
      manual: false,
    });
  });

  it("stores retreat-sync wire-intent with scriptKind payload", () => {
    notifyRecordingFromInteraction({
      kind: "retreat-sync",
      label: "CJM step back — sync select-book-date",
      scriptId: "select-book-date",
      scriptKind: "book",
      beatId: "book-step2",
      atMs: 55,
    });

    expect(getActiveRecordingSession()?.events[0]).toMatchObject({
      kind: "wire-intent",
      intentId: "retreat-sync",
      payload: {
        beatId: "book-step2",
        scriptId: "select-book-date",
        scriptKind: "book",
      },
    });
  });
});

describe("recording human click capture", () => {
  beforeEach(() => {
    resetRecordingSessionForTests();
    resetRecordingCaptureForTests();
  });

  afterEach(() => {
    resetRecordingSessionForTests();
    resetRecordingCaptureForTests();
  });

  function mockClickTarget(options: {
    action?: string;
    chrome?: boolean;
  }): HTMLElement {
    const el = {
      getAttribute: (name: string) =>
        name === "data-studio-action" ? options.action ?? null : null,
      closest: (sel: string) => {
        if (options.chrome && sel.includes("studio-nav-panel-host")) {
          return el;
        }
        if (
          options.action &&
          (sel.includes("data-studio-action") || sel.includes("button"))
        ) {
          return el;
        }
        if (!options.chrome && sel.includes("studio-nav-panel-host")) {
          return null;
        }
        if (sel.includes("button") || sel.includes("data-studio-action")) {
          return options.action || !options.chrome ? el : null;
        }
        return null;
      },
    } as unknown as HTMLElement;
    return el;
  }

  it("ignores untrusted clicks and chrome targets", () => {
    startRecording();
    const btn = mockClickTarget({ action: "book-step-1-continue" });
    const chromeBtn = mockClickTarget({ chrome: true });

    expect(
      shouldCaptureRecordingHumanClick({
        isTrusted: false,
        target: btn,
      } as unknown as Event)
    ).toBe(false);

    expect(isRecordingChromeTarget(chromeBtn)).toBe(true);
    expect(resolveRecordingHumanClickTarget(chromeBtn)).toBeNull();
    expect(
      shouldCaptureRecordingHumanClick({
        isTrusted: true,
        target: btn,
      } as unknown as Event)
    ).toBe(true);
  });

  it("requires active recording for trusted concept clicks", () => {
    const btn = mockClickTarget({ action: "book-step-1-continue" });
    expect(
      shouldCaptureRecordingHumanClick({
        isTrusted: true,
        target: btn,
      } as unknown as Event)
    ).toBe(false);

    startRecording();
    expect(
      shouldCaptureRecordingHumanClick({
        isTrusted: true,
        target: btn,
      } as unknown as Event)
    ).toBe(true);
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

    const session: RecordingSession = {
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
      stepDelayMs: 0,
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(transport).toHaveBeenCalledWith("step-forward");
    expect(result.replayed).toBe(2);
    expect(result.unsupported).toBe(1);

    vi.useRealTimers();
  });

  it("resolveRecordingReplayHoldMs floors major steps at 4s and settles scroll briefly", () => {
    const screen = {
      kind: "screen" as const,
      screenId: "plp",
      atMs: 0,
    };
    const next = {
      kind: "demo-click" as const,
      element: "tile",
      atMs: 1200,
    };
    expect(
      resolveRecordingReplayHoldMs(screen, next, RECORDING_REPLAY_MIN_STEP_HOLD_MS)
    ).toBe(RECORDING_REPLAY_MIN_STEP_HOLD_MS);

    const longGapNext = { ...next, atMs: 9000 };
    expect(
      resolveRecordingReplayHoldMs(
        screen,
        longGapNext,
        RECORDING_REPLAY_MIN_STEP_HOLD_MS
      )
    ).toBe(9000);

    const scroll = {
      kind: "scroll" as const,
      scrollTop: 400,
      atMs: 100,
    };
    expect(
      resolveRecordingReplayHoldMs(scroll, next, RECORDING_REPLAY_MIN_STEP_HOLD_MS)
    ).toBeGreaterThanOrEqual(200);
    expect(
      resolveRecordingReplayHoldMs(scroll, next, RECORDING_REPLAY_MIN_STEP_HOLD_MS)
    ).toBeLessThan(RECORDING_REPLAY_MIN_STEP_HOLD_MS);

    expect(resolveRecordingReplayHoldMs(screen, next, 0)).toBe(0);
  });

  it("replays screen events via applyScreen in order", async () => {
    vi.useFakeTimers();
    const applyScreen = vi.fn(() => true);
    const transport = vi.fn();

    const session: RecordingSession = {
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

  it("replays demo-click events via applyDemoClick in order", async () => {
    const applyDemoClick = vi.fn(() => true);
    const session: RecordingSession = {
      id: "demo-click-replay",
      version: 1,
      startedAt: "2026-07-19T00:00:00.000Z",
      events: [
        {
          kind: "screen",
          screenId: "book-step-1",
          projectId: "boots-pharmacy",
          atMs: 1,
        },
        {
          kind: "demo-click",
          element: 'data-studio-action="book-step-1-continue"',
          selectorChain: ['[data-studio-action="book-step-1-continue"]'],
          atMs: 2,
        },
        {
          kind: "demo-click",
          element: 'data-studio-action="book-step-2-reserve"',
          selectorChain: ['[data-studio-action="book-step-2-reserve"]'],
          atMs: 3,
        },
      ],
    };

    const result = await replayRecordingSession(session, {
      applyScreen: vi.fn(() => true),
      applyDemoClick,
      stepDelayMs: 0,
    });

    expect(applyDemoClick).toHaveBeenCalledTimes(2);
    expect(applyDemoClick.mock.calls.map((c) => c[0].selectorChain?.[0])).toEqual([
      '[data-studio-action="book-step-1-continue"]',
      '[data-studio-action="book-step-2-reserve"]',
    ]);
    expect(result.replayed).toBe(3);
    expect(result.unsupported).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("skips demo-click when applyDemoClick returns false", async () => {
    const result = await replayRecordingSession(
      {
        id: "demo-miss",
        version: 1,
        startedAt: "2026-07-19T00:00:00.000Z",
        events: [
          {
            kind: "demo-click",
            element: "missing",
            selectorChain: ['[data-studio-action="missing"]'],
            atMs: 1,
          },
        ],
      },
      {
        applyDemoClick: vi.fn(() => false),
        stepDelayMs: 0,
      }
    );

    expect(result.replayed).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors[0]).toMatch(/demo-click/);
  });

  it("replays wire-intent beat actions and retreat-sync when apply succeeds", async () => {
    const applyWireIntent = vi.fn((event: { intentId: string }) => {
      if (event.intentId === "retreat-sync") return true;
      return event.intentId === "apply-demo-location";
    });

    const result = await replayRecordingSession(
      {
        id: "wire-replay",
        version: 1,
        startedAt: "2026-07-19T00:00:00.000Z",
        events: [
          {
            kind: "wire-intent",
            intentId: "apply-demo-location",
            atMs: 1,
          },
          {
            kind: "wire-intent",
            intentId: "retreat-sync",
            payload: {
              beatId: "book-step2",
              scriptId: "select-book-date",
              scriptKind: "book",
            },
            atMs: 2,
          },
        ],
      },
      {
        applyWireIntent,
        stepDelayMs: 0,
      }
    );

    expect(applyWireIntent).toHaveBeenCalledTimes(2);
    expect(result.replayed).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("replays director-script events via applyDirectorScript", async () => {
    const applyDirectorScript = vi.fn(() => true);
    const result = await replayRecordingSession(
      {
        id: "director-replay",
        version: 1,
        startedAt: "2026-07-19T00:00:00.000Z",
        events: [
          {
            kind: "director-script",
            scriptId: "select-book-date",
            scriptKind: "book",
            beatId: "book-step2",
            atMs: 1,
          },
          {
            kind: "director-script",
            scriptId: "sarah-query-submit",
            scriptKind: "home",
            atMs: 2,
          },
        ],
      },
      {
        applyDirectorScript,
        stepDelayMs: 0,
      }
    );

    expect(applyDirectorScript).toHaveBeenCalledTimes(2);
    expect(applyDirectorScript.mock.calls.map((c) => c[0].scriptId)).toEqual([
      "select-book-date",
      "sarah-query-submit",
    ]);
    expect(result.replayed).toBe(2);
    expect(result.unsupported).toBe(0);
  });

  it("replays beat-enter, scroll, and typed-text when apply hooks succeed", async () => {
    const applyBeatEnter = vi.fn(() => true);
    const applyScroll = vi.fn(() => true);
    const applyTypedText = vi.fn(() => true);

    const result = await replayRecordingSession(
      {
        id: "v3-gaps-replay",
        version: 1,
        startedAt: "2026-07-19T00:00:00.000Z",
        events: [
          {
            kind: "beat-enter",
            actionId: "apply-demo-location",
            beatId: "book-step2",
            atMs: 1,
          },
          {
            kind: "beat-enter",
            actionId: "sync-select-book-date",
            beatId: "book-step2",
            atMs: 2,
          },
          { kind: "scroll", scrollTop: 240, atMs: 3 },
          {
            kind: "typed-text",
            value: "London",
            selectorChain: ['[data-studio-action="avail-search-query"]'],
            element: 'data-studio-action="avail-search-query"',
            inputType: "text",
            atMs: 4,
          },
        ],
      },
      {
        applyBeatEnter,
        applyScroll,
        applyTypedText,
        stepDelayMs: 0,
      }
    );

    expect(applyBeatEnter).toHaveBeenCalledTimes(2);
    expect(applyBeatEnter.mock.calls.map((c) => c[0].actionId)).toEqual([
      "apply-demo-location",
      "sync-select-book-date",
    ]);
    expect(applyScroll).toHaveBeenCalledWith({
      scrollTop: 240,
      anchorSelector: undefined,
      selectorChain: undefined,
    });
    expect(applyTypedText).toHaveBeenCalledWith(
      expect.objectContaining({ value: "London" })
    );
    expect(result.replayed).toBe(4);
    expect(result.unsupported).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("counts beat-enter / scroll / typed-text unsupported when apply hooks missing", async () => {
    const result = await replayRecordingSession(
      {
        id: "v3-unsupported",
        version: 1,
        startedAt: "2026-07-19T00:00:00.000Z",
        events: [
          { kind: "beat-enter", actionId: "apply-demo-location", atMs: 1 },
          { kind: "scroll", scrollTop: 10, atMs: 2 },
          {
            kind: "typed-text",
            value: "x",
            selectorChain: ['[data-studio-action="avail-search-query"]'],
            atMs: 3,
          },
          { kind: "transport", action: "step-forward", atMs: 4 },
        ],
      },
      {
        triggerTransport: vi.fn(),
        stepDelayMs: 0,
      }
    );

    expect(result.replayed).toBe(1);
    expect(result.unsupported).toBe(3);
  });
});

describe("recording scroll + typed-text capture", () => {
  beforeEach(() => {
    resetRecordingSessionForTests();
    resetRecordingCaptureForTests();
  });

  afterEach(() => {
    resetRecordingSessionForTests();
    resetRecordingCaptureForTests();
  });

  it("captures scroll and typed-text only while recording is active", () => {
    captureScroll({ scrollTop: 50 });
    captureTypedText({
      value: "nope",
      selectorChain: ['[data-studio-action="avail-search-query"]'],
    });
    expect(getActiveRecordingSession()).toBeNull();

    startRecording();
    captureScroll({ scrollTop: 120 });
    captureTypedText({
      value: "London",
      selectorChain: ['[data-studio-action="avail-search-query"]'],
      element: 'data-studio-action="avail-search-query"',
      inputType: "text",
    });

    const session = getActiveRecordingSession();
    expect(session?.events.map((e) => e.kind)).toEqual([
      "scroll",
      "typed-text",
    ]);
    expect(session?.events[0]).toMatchObject({
      kind: "scroll",
      scrollTop: 120,
      // Direct captureScroll API may omit target; DOM flush fills selectorChain.
    });
    expect(session?.events[1]).toMatchObject({
      kind: "typed-text",
      value: "London",
    });
  });

  it("rejects password / checkbox fields for typed-text", () => {
    const mockField = (type: string) =>
      ({
        matches: (sel: string) => {
          if (type === "textarea") return sel.includes("textarea");
          if (type === "password" || type === "checkbox") {
            return false;
          }
          return sel.startsWith("input");
        },
        closest: () => null,
        getAttribute: () => null,
      }) as unknown as Element;

    expect(shouldCaptureRecordingTypedText(mockField("password"))).toBe(false);
    expect(shouldCaptureRecordingTypedText(mockField("checkbox"))).toBe(false);
    expect(shouldCaptureRecordingTypedText(mockField("text"))).toBe(true);
    expect(shouldCaptureRecordingTypedText(mockField("textarea"))).toBe(true);
  });

  it("installs dom capture cleanup without throwing", () => {
    const cleanup = ensureRecordingDomCapture();
    expect(typeof cleanup).toBe("function");
    cleanup();
  });
});

describe("applyRecordingProjectScript", () => {
  it("resolves script kind from id and routes runners", async () => {
    expect(resolvePlaybackScriptKind("select-book-date")).toBe("book");
    expect(resolvePlaybackScriptKind("sarah-query-submit")).toBe("home");
    expect(resolvePlaybackScriptKind("plp-open-pdp")).toBe("tab");

    const runBookScript = vi.fn().mockResolvedValue({ ok: true });
    const playback = {
      runBookScript,
      runHomeScript: vi.fn(),
      runAvailScript: vi.fn(),
      runTabScript: vi.fn(),
      runBeatAction: vi.fn(),
      abortAll: vi.fn(),
    };

    const ok = await applyRecordingProjectScript(
      { scriptId: "select-book-date" },
      playback as never,
      {} as never,
      { skip: true, syncState: true }
    );

    expect(ok).toBe(true);
    expect(runBookScript).toHaveBeenCalledWith("select-book-date", {
      skip: true,
      syncState: true,
    });
  });

  it("returns false for unknown script ids", async () => {
    const ok = await applyRecordingProjectScript(
      { scriptId: "not-a-real-script" },
      {
        runBookScript: vi.fn(),
        runHomeScript: vi.fn(),
        runAvailScript: vi.fn(),
        runTabScript: vi.fn(),
        runBeatAction: vi.fn(),
        abortAll: vi.fn(),
      } as never,
      {} as never
    );
    expect(ok).toBe(false);
  });
});

describe("buildPlaybackSelectorChain", () => {
  it("stops at data-studio-action on the click target", () => {
    const btn = {
      getAttribute: (name: string) =>
        name === "data-studio-action" ? "book-step-1-continue" : null,
      parentElement: {
        getAttribute: () => "Step 4",
        parentElement: null,
        tagName: "DIV",
        id: "",
      },
      tagName: "BUTTON",
      id: "",
    } as unknown as HTMLElement;

    expect(buildPlaybackSelectorChain(btn)).toEqual([
      '[data-studio-action="book-step-1-continue"]',
    ]);
  });
});

describe("resolvePlaybackSelectorChain", () => {
  it("resolves nested outer→inner chains", () => {
    const continueBtn = fakeEl({
      "data-studio-action": "book-step-1-continue",
      "data-name": "component.input.button",
    });
    const body = fakeEl({ "data-name": "body" }, [continueBtn]);
    const root = fakeEl({}, [body]);

    const found = resolvePlaybackSelectorChain(
      [
        '[data-name="body"]',
        '[data-studio-action="book-step-1-continue"]',
      ],
      root as unknown as ParentNode
    );

    expect(found).toBe(continueBtn);
  });

  it("falls back to most-specific unique match", () => {
    const continueBtn = fakeEl({
      "data-studio-action": "book-step-1-continue",
    });
    const root = fakeEl({}, [continueBtn]);

    const found = resolvePlaybackSelectorChain(
      [
        '[data-name="missing-ancestor"]',
        '[data-studio-action="book-step-1-continue"]',
      ],
      root as unknown as ParentNode
    );

    expect(found).toBe(continueBtn);
  });

  it("returns null when chain is empty or unmatched", () => {
    const root = fakeEl({}, []);
    expect(resolvePlaybackSelectorChain(undefined, root as unknown as ParentNode)).toBeNull();
    expect(
      resolvePlaybackSelectorChain(
        ['[data-studio-action="nope"]'],
        root as unknown as ParentNode
      )
    ).toBeNull();
  });
});
