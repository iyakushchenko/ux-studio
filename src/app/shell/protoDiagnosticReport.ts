import type { PlaybackDiagnosticError } from "@/app/shell/protoPlaybackDiagnostic";
import { formatPlaybackScriptSource } from "@/app/shell/playbackScriptRegistry";
import type { PlaybackStudioSnapshot } from "@/app/shell/playbackStudioSnapshot";
import {
  formatRuntimeErrorDetails,
  type RuntimeErrorHint,
} from "@/app/shell/classifyRuntimeError";

function reportHeader(): string[] {
  return [
    "# Studio prototype diagnostic report",
    `generated: ${new Date().toISOString()}`,
    `url: ${typeof window !== "undefined" ? window.location.href : ""}`,
    `mode: ${import.meta.env.MODE}`,
  ];
}

function section(title: string, lines: Record<string, string | undefined>): string[] {
  const body = Object.entries(lines)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => `${key}: ${value}`);
  if (body.length === 0) return [];
  return ["", `## ${title}`, ...body];
}

function snapshotSection(snapshot: PlaybackStudioSnapshot | undefined): string[] {
  if (!snapshot) return [];
  return section("studio", {
    projectId: snapshot.projectId,
    personaId: snapshot.personaId,
    orchestraModeId: snapshot.orchestraModeId,
    journeyId: snapshot.journeyId,
    beat: snapshot.beatIndex != null && snapshot.beatCount != null
      ? `${snapshot.beatIndex + 1}/${snapshot.beatCount} ${snapshot.beatId ?? ""} (${snapshot.beatLabel ?? ""})`.trim()
      : snapshot.beatId,
    protoTab: snapshot.protoTab != null ? String(snapshot.protoTab) : undefined,
    tabIndex: snapshot.currentTabIndex != null ? String(snapshot.currentTabIndex) : undefined,
    childIndex: snapshot.childIndex != null ? String(snapshot.childIndex) : undefined,
    touchpoint: snapshot.touchpointLabel ?? snapshot.touchpointKey,
    scenarioFrames: snapshot.scenarioProgress,
    hubOpen: snapshot.hubOpen != null ? String(snapshot.hubOpen) : undefined,
    availabilityOpen: snapshot.availabilityOpen ? "true" : undefined,
    availStep: snapshot.availStep ?? undefined,
    loginPopupOpen: snapshot.loginPopupOpen ? "true" : undefined,
    vaccinePickerOpen: snapshot.vaccinePickerOpen ? "true" : undefined,
    recipientPickerOpen: snapshot.recipientPickerOpen ? "true" : undefined,
    quickViewOpen: snapshot.quickViewOpen ? "true" : undefined,
  });
}

export function buildRuntimeDiagnosticReport(options: {
  error: unknown;
  hint: RuntimeErrorHint;
  componentStack?: string | null;
}): string {
  const { error, hint, componentStack } = options;
  const details = formatRuntimeErrorDetails(error);
  const name = error instanceof Error ? error.name : "Error";
  const message = error instanceof Error ? error.message : String(error);

  return [
    ...reportHeader(),
    ...section("runtime", {
      kind: "fatal",
      hintId: hint.id,
      title: hint.title,
      errorName: name,
      errorMessage: message,
    }),
    "",
    "## stack",
    details,
    ...(componentStack?.trim()
      ? ["", "## componentStack", componentStack.trim()]
      : []),
  ].join("\n");
}

function parsePlaybackDetailTokens(detail?: string): Record<string, string> {
  if (!detail) return {};
  const tokens: Record<string, string> = {};
  for (const part of detail.split(/\s+/)) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    tokens[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return tokens;
}

function journeyPlaybackContext(
  ctx: PlaybackDiagnosticError["context"],
  snapshot: PlaybackStudioSnapshot | undefined
): Record<string, string | undefined> {
  const tokens = parsePlaybackDetailTokens(ctx.detail);
  const playlistStep = tokens.frames ?? snapshot?.scenarioProgress;
  return {
    journeyPlaylistStep: playlistStep,
    atTouchpoint: snapshot?.touchpointLabel ?? snapshot?.touchpointKey,
    atBeat:
      snapshot?.beatIndex != null && snapshot?.beatCount != null
        ? `${snapshot.beatIndex + 1}/${snapshot.beatCount} ${snapshot.beatId ?? ""} (${snapshot.beatLabel ?? ""})`.trim()
        : snapshot?.beatId,
    afterBeat: tokens.from,
    landedOnBeat: tokens.to,
    directorScript: tokens.script,
    directorBeat: tokens.beat,
  };
}

export function buildPlaybackDiagnosticReport(
  error: PlaybackDiagnosticError
): string {
  const ctx = error.context;
  const snapshot = ctx.snapshot;
  const source = formatPlaybackScriptSource(ctx.scriptKind, ctx.scriptId);

  return [
    ...reportHeader(),
    ...section("playback", {
      phase: ctx.phase,
      message: ctx.message,
      failureStep: ctx.failureStep ?? ctx.actual,
      script: ctx.scriptKind && ctx.scriptId ? `${ctx.scriptKind}/${ctx.scriptId}` : undefined,
      source,
      journeyId: ctx.journeyId ?? snapshot?.journeyId,
      beatId: ctx.beatId ?? snapshot?.beatId,
      beatLabel: ctx.beatLabel ?? snapshot?.beatLabel,
      expected: ctx.expected,
      actual: ctx.actual,
      detail: ctx.detail,
      ...journeyPlaybackContext(ctx, snapshot),
    }),
    ...snapshotSection(snapshot),
  ].join("\n");
}

export async function copyDiagnosticReport(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through */
    }
  }

  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
  return ok;
}
