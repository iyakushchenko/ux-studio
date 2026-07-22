import { markPersistedJourneyPlaybackProven } from "@/app/journey/recordedJourneyPersist";

export type QaSuiteTestId =
  | "mcp-sanity"
  | "mcp-page-probe"
  | "play-current-cjm"
  | "play-all-cjms"
  | "validate-all-cjms"
  | "map-current-interactions"
  | "map-all-interactions"
  | "qa-self-test"
  | "control-room-traditional"
  | "play-agentic"
  | "play-traditional"
  | "rec-traditional"
  | "token-lean-matrix";

export type QaSuiteTest = { id: QaSuiteTestId; options?: Record<string, unknown> };
export const QA_SUITE_COLLECTION: ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  tests: readonly QaSuiteTest[];
}> = [
  { id: "tool-health", label: "QA tool health", description: "Non-destructive live logger and runner sanity", tests: [{ id: "mcp-sanity" }] },
  { id: "current-page", label: "Test current page", description: "Run the current project's registered page contract", tests: [{ id: "mcp-page-probe" }] },
  { id: "current-interactions", label: "Map current page interactions", description: "Inventory and grade every visible interactive candidate without activating it", tests: [{ id: "map-current-interactions" }] },
  { id: "all-interactions", label: "Map all project interactions", description: "Inventory Hub and every registered project page into one machine-readable report", tests: [{ id: "map-all-interactions" }] },
  { id: "current-cjm-fast", label: "Fast test current CJM", description: "Compressed functional proof; target, route, modal, counter, and end-state guards stay strict. Motion-frame samples remain diagnostic-only.", tests: [{ id: "play-current-cjm", options: { playbackSpeed: "fast" } }] },
  { id: "all-cjms-fast", label: "Fast test all CJMs", description: "Compressed functional proof of every project CJM; stops on the first real error. Motion-frame samples remain diagnostic-only.", tests: [{ id: "play-all-cjms", options: { playbackSpeed: "fast" } }] },
  { id: "current-cjm", label: "Test current CJM", description: "Continuously play and prove the currently selected CJM at demo speed", tests: [{ id: "play-current-cjm" }] },
  { id: "all-cjms", label: "Test all CJMs", description: "Enumerate and continuously prove every CJM at demo speed", tests: [{ id: "play-all-cjms" }] },
  { id: "project-core", label: "Current project core", description: "Fast QA health, page contract, interaction map, and structural validation of every project CJM", tests: [{ id: "mcp-sanity" }, { id: "mcp-page-probe" }, { id: "map-all-interactions" }, { id: "validate-all-cjms" }] },
];

export function getQaSuiteDefinition(id: string) {
  return QA_SUITE_COLLECTION.find((suite) => suite.id === id);
}
export type QaSuiteStatus = {
  suiteId: string;
  phase: "idle" | "running" | "paused-failure" | "passed" | "cancelled";
  startedAtIso?: string;
  finishedAtIso?: string;
  elapsedMs?: number;
  /** `fast` = functional proof with visual-frame diagnostics retained but non-blocking. */
  playbackProfile?: "normal" | "fast";
  index: number;
  total: number;
  current: QaSuiteTestId | null;
  /** Nested scope for a suite test such as `play-all-cjms` (shown in QA chrome). */
  scope?: {
    label: string;
    current: number;
    total: number;
    items?: Array<{ label: string; outcome: "pending" | "pass" | "fail" }>;
  };
  completed: Array<{
    id: QaSuiteTestId;
    pass: boolean;
    startedAtIso: string;
    finishedAtIso: string;
    elapsedMs: number;
    result?: unknown;
  }>;
  failure: {
    id: QaSuiteTestId;
    message: string;
    startedAtIso: string;
    finishedAtIso: string;
    elapsedMs: number;
    result?: unknown;
  } | null;
};

const STORAGE_KEY = "studioAutonomousQaSuiteV1";
let activeTests: QaSuiteTest[] = [];
let status: QaSuiteStatus = emptyStatus();
let runToken = 0;

function emptyStatus(): QaSuiteStatus {
  return { suiteId: "", phase: "idle", index: 0, total: 0, current: null, completed: [], failure: null };
}

function qaSuiteTouchpointLabel(id: QaSuiteTestId): string {
  const labels: Record<QaSuiteTestId, string> = {
    "mcp-sanity": "QA tool health",
    "mcp-page-probe": "Current page contract",
    "play-current-cjm": "Current CJM",
    "play-all-cjms": "All CJMs",
    "validate-all-cjms": "CJM structure",
    "map-current-interactions": "Current page interactions",
    "map-all-interactions": "Project interactions",
    "qa-self-test": "QA self-test",
    "control-room-traditional": "Control room",
    "play-agentic": "Agentic CJM",
    "play-traditional": "Traditional CJM",
    "rec-traditional": "New recording",
    "token-lean-matrix": "Token budget",
  };
  return labels[id];
}

function persist(): void {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ status, tests: activeTests })); } catch { /* storage optional */ }
}

function publish(): void {
  persist();
  window.dispatchEvent(new CustomEvent("studio:qa-suite-status", { detail: status }));
}

export function getAutonomousQaSuiteStatus(): QaSuiteStatus {
  return structuredClone(status);
}

export function startAutonomousQaSuite(
  tests: Array<QaSuiteTestId | QaSuiteTest>,
  options?: { suiteId?: string },
) {
  if (status.phase === "running") return { accepted: false, status };
  if (!Array.isArray(tests) || tests.length < 1 || tests.length > 100) {
    throw new Error("QA suite requires 1–100 tests");
  }
  activeTests = tests.map((test) => typeof test === "string" ? { id: test } : test);
  status = {
    suiteId: options?.suiteId?.trim() || `qa-${Date.now().toString(36)}`,
    phase: "running",
    startedAtIso: new Date().toISOString(),
    playbackProfile: activeTests.some((test) => test.options?.playbackSpeed === "fast")
      ? "fast"
      : "normal",
    index: 0,
    total: activeTests.length,
    current: null,
    completed: [],
    failure: null,
    scope: {
      label: "Checks",
      current: 0,
      total: activeTests.length,
      items: activeTests.map((test) => ({ label: qaSuiteTouchpointLabel(test.id), outcome: "pending" })),
    },
  };
  const token = ++runToken;
  const definition = getQaSuiteDefinition(status.suiteId);
  window.__studioAgentTestingOverlay?.logStep({
    label: `Suite started · ${definition?.label ?? status.suiteId} · ${status.playbackProfile === "fast" ? "fast functional proof; motion frames diagnostic-only" : "demo-speed functional and motion proof"}`,
    outcome: "ok",
  });
  publish();
  void runRemaining(token);
  return { accepted: true, status };
}

export function startQaSuiteById(id: string) {
  const suite = getQaSuiteDefinition(id);
  if (!suite) throw new Error(`Unknown QA suite: ${id}`);
  return startAutonomousQaSuite([...suite.tests], { suiteId: suite.id });
}

function passOf(result: unknown): boolean {
  if (result === true) return true;
  if (!result || typeof result !== "object") return false;
  const value = result as { pass?: unknown; ok?: unknown };
  return value.pass === true || value.ok === true;
}

function compactJourneyProof(result: unknown, journeyId?: unknown, pass?: unknown) {
  const proof = result as {
    journeyId?: unknown;
    experience?: unknown;
    peak?: unknown;
    errors?: unknown;
    failureStep?: unknown;
    qaSuite?: { journeyId?: unknown; elapsedMs?: unknown; playbackSpeed?: unknown };
  } | null;
  return {
    journeyId: String(journeyId ?? proof?.qaSuite?.journeyId ?? proof?.journeyId ?? ""),
    pass: pass === undefined ? passOf(result) : pass === true,
    experience: typeof proof?.experience === "string" ? proof.experience : undefined,
    elapsedMs: typeof proof?.qaSuite?.elapsedMs === "number" ? proof.qaSuite.elapsedMs : undefined,
    playbackSpeed: proof?.qaSuite?.playbackSpeed === "fast" ? "fast" : "normal",
    peak: proof?.peak ?? undefined,
    errors: Array.isArray(proof?.errors) ? proof.errors.slice(0, 3) : undefined,
    failureStep: typeof proof?.failureStep === "string" ? proof.failureStep : undefined,
  };
}

function compactCompletedResult(testId: QaSuiteTestId, result: unknown): unknown {
  if (!result || typeof result !== "object") return undefined;
  if (testId === "play-current-cjm") return compactJourneyProof(result);
  if (testId !== "play-all-cjms") return undefined;
  const results = (result as { results?: unknown }).results;
  if (!Array.isArray(results)) return undefined;
  return {
    results: results.map((item) => {
      const row = item as { journeyId?: unknown; pass?: unknown; result?: unknown };
      return compactJourneyProof(row.result, row.journeyId, row.pass);
    }),
  };
}

type JourneySummary = { id: string; label: string; beatCount: number; beatIds: string[] };

function activeJourneyId(): string | null {
  const state = (window as Window & { __protoStudioState?: () => { orchestraMode?: string } }).__protoStudioState?.();
  return state?.orchestraMode?.trim() || null;
}

async function proveJourney(journeyId: string, playbackSpeed: "normal" | "fast" = "normal"): Promise<unknown> {
  const startedAt = Date.now();
  const finish = (result: unknown): unknown => {
    const elapsedMs = Date.now() - startedAt;
    if (result && typeof result === "object") {
      return {
        ...(result as Record<string, unknown>),
        qaSuite: { journeyId, playbackSpeed, elapsedMs },
      };
    }
    return { pass: false, journeyId, qaSuite: { journeyId, playbackSpeed, elapsedMs } };
  };
  const runner = window.__studioRunFullPlayProve;
  if (!runner) return finish({ pass: false, journeyId, failureStep: "runner-unavailable" });
  // A previous stopped suite may leave its takeover latch for the agent. This
  // run owns a fresh boundary; consume that stale signal before monitoring.
  window.__studioConsumePoSignal?.();
  // Full journeys include human-paced cursor, camera, typing, and modal dwell.
  // Keep the autonomous watchdog aligned with the universal full-play ceiling;
  // 90s falsely killed healthy enterprise-demo routes mid-flight.
  const timeoutMs = 300_000;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let signalPollId: ReturnType<typeof setInterval> | undefined;
  const timeout = new Promise<unknown>((resolve) => {
    timeoutId = setTimeout(() => {
      window.__protoPlaybackAbortAll?.();
      resolve({
        pass: false,
        journeyId,
        failureStep: "cjm-playback-timeout",
        message: `CJM playback exceeded ${timeoutMs / 1000}s`,
      });
    }, timeoutMs);
  });
  const failureSignal = new Promise<unknown>((resolve) => {
    signalPollId = setInterval(() => {
      const signal = window.__studioAgentTestingTakeover;
      if (!signal || (signal.type !== "alarm" && signal.type !== "diagnostic")) return;
      window.__protoPlaybackAbortAll?.();
      resolve({
        pass: false,
        journeyId,
        failureStep: signal.code ?? "qa-failure-signal",
        message: signal.note ?? `QA ${signal.type} stopped playback`,
        poSignal: signal,
      });
    }, 100);
  });
  try {
    const runnerPromise = runner({
      journeyId,
      timeoutMs,
      playbackSpeed,
      preArmMs: playbackSpeed === "fast" ? 40 : undefined,
    });
    const raced = await Promise.race([
      runnerPromise.then((result) => ({ source: "runner" as const, result })),
      timeout.then((result) => ({ source: "watchdog" as const, result })),
      failureSignal.then((result) => ({ source: "watchdog" as const, result })),
    ]);
    if (raced.source === "watchdog") {
      // Do not let an aborted child keep running into the next suite/CJM.
      window.__protoAbortAll?.();
      await Promise.race([
        runnerPromise.catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 3_000)),
      ]);
    }
    const result = raced.result;
    if (passOf(result) && /^rec-/i.test(journeyId)) {
      const params = new URLSearchParams(window.location.search);
      markPersistedJourneyPlaybackProven(
        params.get("project") ?? "",
        params.get("persona") ?? "",
        journeyId,
      );
    }
    return finish(result);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    if (signalPollId !== undefined) clearInterval(signalPollId);
  }
}

async function proveAllJourneys(playbackSpeed: "normal" | "fast" = "normal"): Promise<{ pass: boolean; results: Array<{ journeyId: string; pass: boolean; result: unknown }> }> {
  const journeys = window.__protoListJourneys?.() ?? [];
  const results: Array<{ journeyId: string; pass: boolean; result: unknown }> = [];
  const labels = journeys.map((journey) => journey.label || journey.id);
  window.__studioAgentTestingOverlay?.setTimeline?.(labels);
  const items = labels.map((label) => ({ label, outcome: "pending" as const }));
  const setScope = (current: number) => {
    status = { ...status, scope: { label: "CJMs", current, total: journeys.length, items: [...items] } };
    publish();
  };
  setScope(0);
  for (const [index, journey] of journeys.entries()) {
    // Count the on-air journey, not just completed ones: the panel must never
    // appear stalled while an honest playback prove is under way.
    setScope(index + 1);
    const result = await proveJourney(journey.id, playbackSpeed);
    const pass = passOf(result);
    results.push({ journeyId: journey.id, pass, result });
    const label = labels[index];
    items[index] = { label, outcome: pass ? "pass" : "fail" };
    window.__studioAgentTestingOverlay?.markTimeline?.(label, pass ? "pass" : "fail");
    setScope(index + 1);
    if (!pass) return { pass: false, results };
  }
  return { pass: journeys.length > 0, results };
}

export function validateAllJourneys(): {
  pass: boolean;
  results: Array<{ journeyId: string; pass: boolean; issues: string[] }>;
} {
  const journeys = window.__protoListJourneys?.() ?? [];
  const seen = new Set<string>();
  const results = journeys.map((journey) => {
    const issues: string[] = [];
    const id = journey.id?.trim();
    if (!id) issues.push("missing-id");
    else if (seen.has(id)) issues.push("duplicate-id");
    else seen.add(id);
    if (!Number.isInteger(journey.beatCount) || journey.beatCount < 1) {
      issues.push("empty-journey");
    }
    if (!Array.isArray(journey.beatIds) || journey.beatIds.length !== journey.beatCount) {
      issues.push("beat-count-mismatch");
    }
    if (new Set(journey.beatIds).size !== journey.beatIds.length) {
      issues.push("duplicate-beat-id");
    }
    return { journeyId: journey.id, pass: issues.length === 0, issues };
  });
  return { pass: results.length > 0 && results.every((row) => row.pass), results };
}

async function runTest(test: QaSuiteTest): Promise<unknown> {
  switch (test.id) {
    case "mcp-sanity": return window.__studioRunMcpSanityCheck?.();
    case "mcp-page-probe": return window.__studioRunMcpPageProbe?.();
    case "play-current-cjm": {
      const journeyId = activeJourneyId();
      if (!journeyId) throw new Error("No active CJM is selected");
      return proveJourney(journeyId, test.options?.playbackSpeed === "fast" ? "fast" : "normal");
    }
    case "play-all-cjms": return proveAllJourneys(test.options?.playbackSpeed === "fast" ? "fast" : "normal");
    case "validate-all-cjms": return validateAllJourneys();
    case "map-current-interactions": return window.__studioMapCurrentInteractions?.();
    case "map-all-interactions": return window.__studioMapAllInteractions?.();
    case "qa-self-test": return window.__studioRunQaSelfTestSmoke?.();
    case "control-room-traditional": return window.__protoRunTraditionalControlRoomRobotQa?.();
    case "play-agentic": return window.__studioRunFullPlayProve?.({ experience: "agentic" });
    case "play-traditional": return window.__studioRunFullPlayProve?.({ experience: "traditional" });
    case "rec-traditional": return window.__studioRunRecNewCjmProve?.({ experience: "traditional" });
    case "token-lean-matrix": return window.__studioRunTokenLeanRegressionMatrix?.(test.options);
  }
}

async function runRemaining(token: number): Promise<void> {
  while (token === runToken && status.index < activeTests.length) {
    const test = activeTests[status.index];
    const testStartedAt = Date.now();
    const testStartedAtIso = new Date(testStartedAt).toISOString();
    status = { ...status, phase: "running", current: test.id, failure: null };
    window.__studioAgentTestingOverlay?.touch(`QA suite · ${status.index + 1}/${status.total} · ${test.id}`);
    publish();
    let result: unknown;
    try {
      result = await runTest(test);
      if (!passOf(result)) throw new Error("Test returned a non-passing result");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const finishedAt = Date.now();
      status = {
        ...status,
        scope: status.scope?.label === "CJMs"
          ? status.scope
          : status.scope
          ? {
              ...status.scope,
              current: status.index,
              items: status.scope.items?.map((item, index) =>
                index === status.index ? { ...item, outcome: "fail" } : item
              ),
            }
          : status.scope,
        phase: "paused-failure",
        current: test.id,
        finishedAtIso: new Date(finishedAt).toISOString(),
        elapsedMs: status.startedAtIso
          ? finishedAt - new Date(status.startedAtIso).getTime()
          : undefined,
        failure: {
          id: test.id,
          message,
          result,
          startedAtIso: testStartedAtIso,
          finishedAtIso: new Date(finishedAt).toISOString(),
          elapsedMs: finishedAt - testStartedAt,
        },
      };
      window.__studioAgentTestingOverlay?.logStep({ label: `Suite stopped · ${test.id} · ${message}`, outcome: "fail" });
      window.__studioAgentTestingOverlay?.ringAlarm(`QA suite ${status.suiteId} stopped at ${test.id}: ${message}`);
      window.__studioAgentTestingOverlay?.appendFinale("fail", `${test.id} · ${message}`);
      publish();
      return;
    }
    status.completed.push({
      id: test.id,
      pass: true,
      startedAtIso: testStartedAtIso,
      finishedAtIso: new Date().toISOString(),
      elapsedMs: Date.now() - testStartedAt,
      result: compactCompletedResult(test.id, result),
    });
    status = {
      ...status,
      index: status.index + 1,
      scope: status.scope?.label === "CJMs"
        ? status.scope
        : status.scope
          ? {
              ...status.scope,
              current: status.index + 1,
              items: status.scope.items?.map((item, index) =>
                index === status.index ? { ...item, outcome: "pass" } : item
              ),
            }
          : undefined,
    };
    publish();
  }
  if (token !== runToken) return;
  const finishedAt = Date.now();
  status = {
    ...status,
    phase: "passed",
    current: null,
    failure: null,
    finishedAtIso: new Date(finishedAt).toISOString(),
    elapsedMs: status.startedAtIso
      ? finishedAt - new Date(status.startedAtIso).getTime()
      : undefined,
  };
  const allCjmResult = status.completed.find((item) => item.id === "play-all-cjms")
    ?.result as { results?: Array<{ journeyId: string; pass: boolean }> } | undefined;
  const currentCjmResult = status.completed.find((item) => item.id === "play-current-cjm")
    ?.result as { journeyId?: string } | undefined;
  const cjmCount = allCjmResult?.results?.length ?? 0;
  const summary = cjmCount > 0
    ? `${cjmCount}/${cjmCount} CJMs passed`
    : currentCjmResult?.journeyId
      ? `CJM ${currentCjmResult.journeyId} passed`
    : `${status.total}/${status.total} autonomous tests passed`;
  const duration = status.elapsedMs != null ? ` · ${(status.elapsedMs / 1000).toFixed(1)}s` : "";
  window.__studioAgentTestingOverlay?.logStep({
    label: `Suite passed · ${status.suiteId} · ${summary}${duration}`,
    outcome: "ok",
  });
  window.__studioAgentTestingOverlay?.appendFinale("pass", summary);
  publish();
}

export function installAutonomousQaSuiteApi(): () => void {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as { status?: QaSuiteStatus; tests?: QaSuiteTest[] } | null;
    // A finished suite is still evidence. Restore it so a deliberate page refresh
    // cannot turn a green run into an "incomplete" Save Log download.
    if (
      (saved?.status?.phase === "paused-failure" || saved?.status?.phase === "passed")
      && Array.isArray(saved.tests)
    ) {
      status = saved.status;
      activeTests = saved.tests;
    }
  } catch { /* corrupt state starts clean */ }

  window.__studioStartQaSuite = startAutonomousQaSuite;
  window.__studioRunQaSuiteById = startQaSuiteById;
  window.__studioRunGlobalCompatibilityTests = () => startQaSuiteById("all-cjms");
  window.__studioGetQaSuiteStatus = getAutonomousQaSuiteStatus;
  window.__studioProceedQaSuite = () => {
    if (status.phase !== "paused-failure") return { accepted: false, status };
    window.__studioAgentTestingOverlay?.ackDiagnostic();
    window.__studioAgentTestingOverlay?.consumePoSignal();
    const token = ++runToken;
    status = { ...status, phase: "running", failure: null };
    publish();
    void runRemaining(token);
    return { accepted: true, status };
  };
  window.__studioCancelQaSuite = () => {
    runToken += 1;
    window.__protoAbortAll?.();
    status = { ...status, phase: "cancelled", current: null };
    publish();
    return status;
  };
  // Studio helper registration follows orchestra-mode changes. The autonomous
  // runner must outlive that React effect churn or a suite would cancel itself
  // while switching between Agentic and Traditional tests.
  return () => {};
}

declare global {
  interface Window {
    __studioStartQaSuite?: (tests: Array<QaSuiteTestId | QaSuiteTest>, options?: { suiteId?: string }) => { accepted: boolean; status: QaSuiteStatus };
    __studioRunQaSuiteById?: typeof startQaSuiteById;
    __studioRunGlobalCompatibilityTests?: () => ReturnType<typeof startQaSuiteById>;
    __studioGetQaSuiteStatus?: () => QaSuiteStatus;
    __studioProceedQaSuite?: () => { accepted: boolean; status: QaSuiteStatus };
    __studioCancelQaSuite?: () => QaSuiteStatus;
    __studioRunMcpSanityCheck?: () => Promise<unknown>;
    __studioRunQaSelfTestSmoke?: () => Promise<unknown>;
    __studioRunFullPlayProve?: (options: { experience?: "agentic" | "traditional"; journeyId?: string; timeoutMs?: number; preArmMs?: number; playbackSpeed?: "normal" | "fast" }) => Promise<unknown>;
    __studioRunMcpPageProbe?: () => Promise<unknown>;
    __protoListJourneys?: () => JourneySummary[];
    __studioRunRecNewCjmProve?: (options: { experience: "traditional" }) => Promise<unknown>;
    __studioRunTokenLeanRegressionMatrix?: (options?: Record<string, unknown>) => Promise<unknown>;
    __protoAbortAll?: () => void;
    __protoPlaybackAbortAll?: () => void;
    __studioAgentTestingTakeover?: {
      type?: string;
      code?: string;
      note?: string;
    } | null;
    __studioConsumePoSignal?: () => unknown;
  }
}
