import type { JourneyDefinition } from "@/app/orchestra/types";
import type { RecordingSession } from "@/app/recording/recordingTypes";
import { getStudioRelease } from "@/app/shell/studioRelease";

export const CJM_PLAYBACK_CONTRACT_VERSION = 1 as const;

function hasCurrentCompatibilityProof(session: RecordingSession): boolean {
  const proof = session.metadata?.compatibilityProof;
  return (
    proof?.playbackContract === CJM_PLAYBACK_CONTRACT_VERSION &&
    proof.studioVersion === getStudioRelease().version
  );
}

export type CjmMetadataIssue = {
  code: string;
  detail: string;
  severity?: "warning" | "blocking";
};

export type CjmOptionMetadata = {
  journeyId: string;
  label: string;
  stepCount: number;
  authLabel: string;
  recordedAt: string | null;
  recordedAtLabel: string;
  authorLabel: string;
  builtIn: boolean;
  issues: CjmMetadataIssue[];
  playable: boolean;
  summary: string;
  diagnostic: Record<string, unknown>;
};

function formatRecordedAt(value: string | undefined): string {
  if (!value) return "Date unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalid";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function resolveAuthLabel(session?: RecordingSession): string {
  const states = session?.metadata?.authStates ?? [];
  if (states.includes("guest") && states.includes("user")) return "Guest + user";
  if (states.includes("user")) return "User";
  if (states.includes("guest")) return "Guest";
  return "Auth unknown";
}

function resolveAuthorLabel(session?: RecordingSession): string {
  if (session?.metadata?.author === "agent") return "Agent";
  if (session?.metadata?.author === "user") return "User";
  if (session?.metadata?.recordedFrom === "mcp") return "Agent (legacy)";
  return "Author unknown";
}

export function buildCjmOptionMetadata(
  journey: JourneyDefinition,
  session?: RecordingSession
): CjmOptionMetadata {
  const builtIn = journey.id === "agentic-cjm" || journey.id === "traditional-cjm";
  const currentVersion = getStudioRelease().version;
  const currentProof = session ? hasCurrentCompatibilityProof(session) : false;
  const issues: CjmMetadataIssue[] = [];
  if (!builtIn && !session) {
    issues.push({
      code: "recording-source-missing",
      detail: "Raw REC session is unavailable; provenance and compatibility cannot be fully verified.",
      severity: "blocking",
    });
  }
  if (
    session &&
    session.metadata?.recordingContractVersion !== CJM_PLAYBACK_CONTRACT_VERSION &&
    !currentProof
  ) {
    issues.push({
      code: "legacy-recording-contract",
      detail: "Recording predates the current metadata contract; run playback to establish a current compatibility proof.",
      severity: "warning",
    });
  }
  if (
    session?.metadata?.studioVersion &&
    session.metadata.studioVersion !== currentVersion &&
    !currentProof
  ) {
    issues.push({
      code: "retest-required",
      detail: `Recorded in Studio v${session.metadata.studioVersion}; playback proof is required for the current contract.`,
      severity: "warning",
    });
  }
  if (session && session.version !== 1) {
    issues.push({
      code: "recording-version-unsupported",
      detail: `Recording schema v${String(session.version)} is not supported by this Studio build.`,
      severity: "blocking",
    });
  }
  if (journey.beats.length === 0) {
    issues.push({ code: "empty-journey", detail: "CJM has no playable steps.", severity: "blocking" });
  }
  const unstableClicks = session?.events.filter(
    (event) =>
      event.kind === "demo-click" &&
      (!event.selectorChain?.length || event.selectorChain.includes("#root"))
  ).length ?? 0;
  if (unstableClicks > 0) {
    issues.push({
      code: "unstable-click-targets",
      detail: `${unstableClicks} recorded interaction${unstableClicks === 1 ? " has" : "s have"} no stable playback target.`,
      severity: "blocking",
    });
  }

  const authLabel = builtIn ? "Auth varies" : resolveAuthLabel(session);
  const recordedAtLabel = builtIn
    ? "Built-in"
    : formatRecordedAt(session?.startedAt);
  const authorLabel = builtIn ? "Studio" : resolveAuthorLabel(session);
  const summary = `${journey.beats.length} ${journey.beats.length === 1 ? "step" : "steps"} · ${authLabel} · ${recordedAtLabel} · ${authorLabel}`;
  const playable = !issues.some((issue) => issue.severity === "blocking");
  const diagnostic = {
    kind: "studio-cjm-diagnostic",
    generatedAt: new Date().toISOString(),
    journey: {
      id: journey.id,
      label: journey.label,
      stepCount: journey.beats.length,
      builtIn,
    },
    recording: session
      ? {
          id: session.id,
          version: session.version,
          startedAt: session.startedAt,
          stoppedAt: session.stoppedAt ?? null,
          eventCount: session.events.length,
          author: session.metadata?.author ?? null,
          authStates: session.metadata?.authStates ?? [],
          recordedFrom: session.metadata?.recordedFrom ?? null,
          studioVersion: session.metadata?.studioVersion ?? null,
          contractVersion: session.metadata?.recordingContractVersion ?? null,
          compatibilityProof: session.metadata?.compatibilityProof ?? null,
        }
      : null,
    currentStudioVersion: currentVersion,
    playable,
    issues,
  };
  return {
    journeyId: journey.id,
    label: journey.label,
    stepCount: journey.beats.length,
    authLabel,
    recordedAt: session?.startedAt ?? null,
    recordedAtLabel,
    authorLabel,
    builtIn,
    issues,
    playable,
    summary,
    diagnostic,
  };
}

export function buildCjmMetadataCatalog(
  journeys: readonly JourneyDefinition[],
  resolveRecording: (journeyId: string) => RecordingSession | undefined
): Record<string, CjmOptionMetadata> {
  return Object.fromEntries(
    journeys.map((journey) => [
      journey.id,
      buildCjmOptionMetadata(journey, resolveRecording(journey.id)),
    ])
  );
}

const AGENT_PLACEHOLDER_LABEL = /\b(?:qa|test|prove|recording|recorded|new cjm|route\s*\d*)\b/i;

/** Agent-created titles must describe actor/context + meaningful path/outcome. */
export function assertSemanticAgentCjmLabel(label: string): void {
  const clean = label.trim();
  if (clean.length < 12 || AGENT_PLACEHOLDER_LABEL.test(clean)) {
    throw new Error(
      "Agent CJM title must describe the human journey (actor/context + path or outcome), e.g. ‘Sarah · PLP→Book appointment’; QA/test/prove/recording labels are forbidden."
    );
  }
  if (!/[→·:—-]/.test(clean)) {
    throw new Error(
      "Agent CJM title needs semantic structure, e.g. ‘Sarah · PLP→Book appointment’."
    );
  }
}
