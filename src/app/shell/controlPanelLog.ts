import type { PlaybackStudioSnapshot } from "@/app/shell/playbackStudioSnapshot";

/** Filter DevTools console with: `[StudioControlPanel]` */
export const CONTROL_PANEL_LOG_PREFIX = "[StudioControlPanel]";

export type ControlPanelAction =
  | "transport:jump-to-start"
  | "transport:step-back"
  | "transport:play"
  | "transport:step-forward"
  | "transport:jump-to-end"
  | "nav:hub"
  | "nav:tab"
  | "nav:dot"
  | "nav:prev-screen"
  | "nav:next-screen"
  | "nav:reset-page"
  | "studio:journey-mode"
  | "studio:playback-rec-mode"
  | "studio:project"
  | "studio:persona"
  | "studio:orchestra-mode"
  | "studio:select-open"
  | "studio:select-close"
  | "recording:start"
  | "recording:pause"
  | "recording:resume"
  | "recording:stop"
  | "recording:download"
  | "recording:import"
  | "recording:replay"
  | "diagnostic:open"
  | "diagnostic:dismiss"
  | "diagnostic:copy-report"
  | "qa:phase"
  | "qa:check"
  | "qa:cursor"
  | "qa:run";

export type ControlPanelLogEntry = {
  seq: number;
  atMs: number;
  atIso: string;
  action: ControlPanelAction;
  detail?: Record<string, unknown>;
  snapshot?: PlaybackStudioSnapshot & Record<string, unknown>;
  blocked?: boolean;
  blockReason?: string;
};

declare global {
  interface Window {
    __protoControlPanelLog?: ControlPanelLogEntry[];
    dumpProtoControlPanelLog?: () => ControlPanelLogEntry[];
  }
}

const MAX_ENTRIES = 300;

let seq = 0;
const ring: ControlPanelLogEntry[] = [];
let snapshotProvider: (() => PlaybackStudioSnapshot & Record<string, unknown>) | null =
  null;

export function registerControlPanelSnapshotProvider(
  provider: (() => PlaybackStudioSnapshot & Record<string, unknown>) | null
): void {
  snapshotProvider = provider;
}

/** Latest control-panel snapshot (for agent-testing sitrep). */
export type ControlPanelSnapshot = PlaybackStudioSnapshot & Record<string, unknown>;

export function getControlPanelSnapshot(): ControlPanelSnapshot | null {
  try {
    return snapshotProvider?.() ?? null;
  } catch {
    return null;
  }
}

export type ControlPanelLogDetail = Record<string, unknown> & {
  blocked?: boolean;
  blockReason?: string;
};

export function logControlPanel(
  action: ControlPanelAction,
  detail?: ControlPanelLogDetail
): ControlPanelLogEntry {
  const { blocked, blockReason, ...rest } = detail ?? {};
  const snapshot = snapshotProvider?.() ?? undefined;
  const entry: ControlPanelLogEntry = {
    seq: ++seq,
    atMs: performance.now(),
    atIso: new Date().toISOString(),
    action,
    detail: Object.keys(rest).length > 0 ? rest : undefined,
    snapshot,
    blocked: blocked || undefined,
    blockReason: blocked ? blockReason : undefined,
  };

  ring.push(entry);
  if (ring.length > MAX_ENTRIES) {
    ring.splice(0, ring.length - MAX_ENTRIES);
  }

  if (typeof window !== "undefined") {
    window.__protoControlPanelLog = ring;
    window.dumpProtoControlPanelLog = dumpControlPanelLog;
  }

  const payload = {
    seq: entry.seq,
    ...rest,
    snapshot,
  };

  if (blocked) {
    console.warn(
      `${CONTROL_PANEL_LOG_PREFIX} BLOCKED ${action}${
        blockReason ? ` — ${blockReason}` : ""
      }`,
      payload
    );
  } else if (
    action === "diagnostic:open" ||
    action === "diagnostic:dismiss"
  ) {
    console.warn(`${CONTROL_PANEL_LOG_PREFIX} ${action}`, payload);
  } else {
    console.log(`${CONTROL_PANEL_LOG_PREFIX} ${action}`, payload);
  }

  return entry;
}

/** In-memory ring copy (no console). Used by agent-testing FAIL/alarm dumps. */
export function getControlPanelLogEntries(): ControlPanelLogEntry[] {
  return [...ring];
}

/** Print recent control-panel interactions — also on `window.dumpProtoControlPanelLog()`. */
export function dumpControlPanelLog(): ControlPanelLogEntry[] {
  const copy = getControlPanelLogEntries();
  console.group(`${CONTROL_PANEL_LOG_PREFIX} dump (${copy.length} entries)`);
  console.table(
    copy.map((entry) => ({
      seq: entry.seq,
      at: entry.atIso,
      action: entry.action,
      blocked: entry.blocked ?? "",
      beat: entry.snapshot?.beatId ?? "",
      touchpoint: entry.snapshot?.touchpointKey ?? "",
      steps: entry.snapshot?.scenarioProgress ?? "",
      ...entry.detail,
    }))
  );
  console.groupEnd();
  return copy;
}

/** Test-only — clears the in-memory ring buffer. */
export function resetControlPanelLogForTests(): void {
  ring.length = 0;
  seq = 0;
  if (typeof window !== "undefined") {
    window.__protoControlPanelLog = ring;
  }
}
